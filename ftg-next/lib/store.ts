// Simple in-memory store for development/POC purposes
// Note: In a real production app, this would be a database or Redis.
let storedData: any[] = [];

export const getStoredData = () => storedData;

export const setStoredData = (data: any) => {
    storedData = [data];
};
