// src/helper/ipGeo.ts

import axios from 'axios'; // You might need to install axios: npm install axios or yarn add axios
import logger from './logging'; // Assuming your logger is here

interface IpGeoResponse {
    status: 'success' | 'fail';
    country?: string;
    countryCode?: string;
    region?: string;
    regionName?: string;
    city?: string;
    zip?: string;
    lat?: number;
    lon?: number;
    timezone?: string;
    isp?: string;
    org?: string;
    as?: string;
    query: string;
    message?: string; // Error message if status is 'fail'
}

const IP_API_BASE_URL = 'http://ip-api.com/json/'; // Free, public API for IP geolocation

/**
 * @function getIpCountry
 * @description Fetches country information for a given IP address.
 * @param {string} ip - The IP address to lookup.
 * @returns {Promise<string | null>} - The country name if successful, otherwise null.
 */
export async function getIpCountry(ip: string): Promise<string | null> {
    // For localhost (::1 or 127.0.0.1), ip-api.com returns private range, so return null or a specific value
    if (ip === '::1' || ip === '127.0.0.1') {
        return 'Localhost';
    }

    try {
        const response = await axios.get<IpGeoResponse>(`${IP_API_BASE_URL}${ip}`);
        const data = response.data;

        if (data.status === 'success' && data.country) {
            return data.country;
        } else {
            logger.warn(`Failed to get country for IP ${ip}: ${data.message || 'Unknown error'}`);
            return null;
        }
    } catch (error: any) {
        logger.error(`Error fetching IP geolocation for ${ip}: ${error.message}`);
        return null;
    }
}
