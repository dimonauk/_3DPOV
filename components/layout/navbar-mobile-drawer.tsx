"use client";

/**
 * components/layout/navbar-mobile-drawer.tsx — Mobile drawer for the navbar.
 *
 * Headless UI Dialog with the same animation grammar as the rest of the site
 * (fade backdrop + slide-from-left panel). Renders the same GROUPS as the
 * desktop nav, plus The Stack as a separate "bench" section.
 */

import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import LogoSquare from "components/logo-square";

import { GROUPS, isLinkActive } from "./navbar-config";

export function MobileDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <Transition show={isOpen}>
      <Dialog onClose={onClose} className="relative z-50 md:hidden">
        <Transition.Child
          as={Fragment}
          enter="transition-all ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-all ease-in-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-warm-black-950/70 backdrop-blur-sm"
            aria-hidden="true"
          />
        </Transition.Child>
        <Transition.Child
          as={Fragment}
          enter="transition-all ease-in-out duration-300"
          enterFrom="translate-x-[-100%]"
          enterTo="translate-x-0"
          leave="transition-all ease-in-out duration-200"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-[-100%]"
        >
          <Dialog.Panel className="fixed inset-y-0 left-0 flex w-full max-w-sm flex-col overflow-y-auto border-r border-warm-black-800 bg-warm-black-950 px-4 pb-8 pt-4">
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3 text-chrome-100"
                aria-label="Holo-Flow Studio — home"
              >
                <LogoSquare size="sm" />
                <div className="flex flex-col leading-tight">
                  <span className="chrome-label text-[0.6rem]">Holo-Flow</span>
                  <span
                    className="font-display text-base chrome-sheen"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Studio
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-warm-black-700 text-chrome-200 transition-colors hover:border-pink-200/60 hover:text-pink-200"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <nav aria-label="Site" className="flex flex-col gap-8">
              {GROUPS.map((group) => (
                <section key={group.label}>
                  <div className="chrome-label mb-3 text-[0.65rem] text-chrome-400">
                    {group.label}
                  </div>
                  <ul className="flex flex-col">
                    {group.links.map((link) => {
                      const active = isLinkActive(pathname, link.href);
                      return (
                        <li key={link.href}>
                          <Link
                            href={link.href}
                            onClick={onClose}
                            className={`block py-2 text-base transition-colors ${
                              active
                                ? "text-pink-200"
                                : "text-chrome-200 hover:text-pink-200"
                            }`}
                          >
                            {link.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}

              <section>
                <div className="chrome-label mb-3 text-[0.65rem] text-chrome-400">
                  The bench
                </div>
                <Link
                  href="/stack"
                  onClick={onClose}
                  className={`block py-2 text-base transition-colors ${
                    isLinkActive(pathname, "/stack")
                      ? "text-pink-200"
                      : "text-chrome-200 hover:text-pink-200"
                  }`}
                >
                  The Stack
                </Link>
              </section>
            </nav>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
