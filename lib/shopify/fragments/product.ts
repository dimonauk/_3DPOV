import imageFragment from "./image";
import seoFragment from "./seo";

const productFragment = /* GraphQL */ `
  fragment product on Product {
    id
    handle
    availableForSale
    title
    description
    descriptionHtml
    options {
      id
      name
      values
    }
    priceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 250) {
      edges {
        node {
          id
          title
          availableForSale
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
        }
      }
    }
    featuredImage {
      ...image
    }
    images(first: 20) {
      edges {
        node {
          ...image
        }
      }
    }
    seo {
      ...seo
    }
    tags
    updatedAt
    metafields(
      identifiers: [
        { namespace: "custom", key: "model_3d" }
        { namespace: "custom", key: "model_3d_usdz" }
      ]
    ) {
      key
      namespace
      value
      reference {
        ... on GenericFile {
          url
        }
        ... on Model3d {
          sources {
            url
            format
          }
        }
      }
    }
  }
  ${imageFragment}
  ${seoFragment}
`;

export default productFragment;
