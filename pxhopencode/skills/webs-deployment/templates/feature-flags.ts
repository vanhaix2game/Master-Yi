// Feature flag cho canary
export async function getFeatureFlags(userId: string) {
  const hash = hashCode(userId) % 100;
  return {
    newCheckout: hash < 10,
    newDashboard: hash < 5,
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
