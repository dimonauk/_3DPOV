"use client";

/**
 * app/atelier/sculpture-gallery/sculpture-gallery/use-image-to-glb.ts
 * — Operator-only Hunyuan3D pipeline: image → bench → GLB. Owns the
 * image preview URL, the in-flight POST state, and lazy-loads the
 * `<model-viewer>` custom element on mount.
 *
 * Extracted from sculpture-gallery-client.tsx per ARCHITECTURE.md
 * Rule 1.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "components/auth/auth-provider";
import { createLogger } from "lib/log";
import { pushAtelierOutput } from "lib/state/atelier-hooks";

import type { ImageToGlbState } from "./types";

const imageLog = createLogger("atelier:sculpture-gallery:image-to-glb");

export function useImageToGlb() {
  const { user } = useAuth();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageState, setImageState] = useState<ImageToGlbState>({
    kind: "idle",
  });
  const modelViewerLoadedRef = useRef(false);

  // Pull the model-viewer custom element in once — it's a side-effect
  // import that registers `<model-viewer>` as a custom element.
  useEffect(() => {
    if (modelViewerLoadedRef.current) return;
    modelViewerLoadedRef.current = true;
    import("@google/model-viewer").catch((err) => {
      imageLog.warn("model-viewer load failed", { err });
    });
  }, []);

  // Free the preview object URL on swap / unmount.
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const onImagePicked = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        setImageState({
          kind: "error",
          message: "That doesn't look like an image.",
        });
        return;
      }
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      setImageFile(file);
      setImageState({ kind: "idle" });
    },
    [imagePreviewUrl],
  );

  const onGenerateGlb = useCallback(async () => {
    if (!imageFile) return;
    if (!user) {
      setImageState({
        kind: "error",
        message:
          "Sign in as an operator — Hunyuan3D burns bench VRAM, so the route is gated.",
      });
      return;
    }
    const startedAt = Date.now();
    setImageState({ kind: "running", startedAt });
    try {
      const idToken = await user.getIdToken();
      const fd = new FormData();
      fd.append("image", imageFile, imageFile.name);
      const res = await fetch(
        "/api/atelier/sculpture-gallery/image-to-glb",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
          body: fd,
        },
      );
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const body = (await res.json()) as { error?: string };
          if (body?.error) detail = body.error;
        } catch {
          /* ignore */
        }
        throw new Error(detail);
      }
      const body = (await res.json()) as {
        glbUrl: string;
        glbBytes: number;
      };
      const base = imageFile.name.replace(/\.[^.]+$/, "") || "mesh";
      const filename = `${base}_hunyuan3d.glb`;
      setImageState({
        kind: "ready",
        glbUrl: body.glbUrl,
        glbBytes: body.glbBytes,
        filename,
        durationMs: Date.now() - startedAt,
      });
      pushAtelierOutput({
        chamberSlug: "sculpture-gallery",
        kind: "glb",
        label: filename,
        blobUrl: body.glbUrl,
        mimeType: "model/gltf-binary",
        sizeBytes: body.glbBytes,
      });
    } catch (err) {
      imageLog.error("image-to-glb failed", { err });
      setImageState({
        kind: "error",
        message: err instanceof Error ? err.message : "Generation failed.",
      });
    }
  }, [imageFile, user]);

  return {
    user,
    imageFile,
    imagePreviewUrl,
    imageState,
    onImagePicked,
    onGenerateGlb,
  };
}
