export const getShopPolicyQuery = /* GraphQL */ `
  query getShopPolicy {
    shop {
      privacyPolicy {
        id
        title
        body
        handle
        url
      }
      termsOfService {
        id
        title
        body
        handle
        url
      }
      refundPolicy {
        id
        title
        body
        handle
        url
      }
      shippingPolicy {
        id
        title
        body
        handle
        url
      }
      subscriptionPolicy {
        id
        title
        body
        handle
        url
      }
    }
  }
`;
