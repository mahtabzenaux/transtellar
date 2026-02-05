export const formatBalance = (value: string | number, maxDecimals: number = 8): string => {
    if (value === undefined || value === null || value === '') return '0.0000';

    let numStr = typeof value === 'string' ? value : value.toString();

    // Handle potential scientific notation from very small numbers
    const num = Number(value);
    if (isNaN(num)) return '0.0000';

    if (numStr.includes('e')) {
        numStr = num.toFixed(20);
    }

    const [integer, fraction] = numStr.split('.');
    if (!fraction) return `${integer}.0000`;

    // Truncate to maxDecimals without rounding
    const truncatedFraction = fraction.slice(0, maxDecimals);

    // Pad to at least 4 decimals
    const finalFraction = truncatedFraction.length < 4
        ? truncatedFraction.padEnd(4, '0')
        : truncatedFraction;

    // Clean up trailing zeros BEYOND 4 decimals
    let resultFraction = finalFraction;
    if (resultFraction.length > 4) {
        resultFraction = resultFraction.replace(/0+$/, '');
        if (resultFraction.length < 4) resultFraction = resultFraction.padEnd(4, '0');
    }

    return `${integer}.${resultFraction}`;
};
