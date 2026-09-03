const clampRandom = value => Math.min(Math.max(Number(value) || 0, 0), .999999);

export function buildActivities(customers = [], products = []) {
    const names = products.map(product => product?.name?.trim()).filter(Boolean);
    const customerNames = customers.map(customer => customer?.customer?.trim()).filter(Boolean);
    if (!customerNames.length || !names.length) return [];
    const length = Math.max(customerNames.length, names.length);

    return Array.from({ length }, (_, index) => ({
        customer: customerNames[index % customerNames.length],
        product: names[index % names.length],
    }));
}

export function pickNextActivityIndex(length, currentIndex, random = Math.random) {
    if (length < 1) return -1;
    if (length === 1) return 0;
    const offset = 1 + Math.floor(clampRandom(random()) * (length - 1));
    return (currentIndex + offset + length) % length;
}

export function activityDelay(random = Math.random) {
    return 3000 + Math.floor(clampRandom(random()) * 2001);
}
