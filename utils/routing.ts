import { Site, RouteOptimizationConfig, RouteSuggestion, RouteMode } from '../types';

type Point = { latitude: number; longitude: number };

// Haversine formula to calculate distance between two lat/lng points
function haversineDistance(p1: Point, p2: Point): number {
    const R = 6371; // Radius of the Earth in km
    const dLat = (p2.latitude - p1.latitude) * Math.PI / 180;
    const dLon = (p2.longitude - p1.longitude) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(p1.latitude * Math.PI / 180) * Math.cos(p2.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Calculate all metrics for a given route order
function calculateRouteMetrics(orderedSites: Site[], startPoint: Point, config: RouteOptimizationConfig): Omit<RouteSuggestion, 'mode' | 'orderedSites'> {
    let totalDistance = 0;
    const warnings: string[] = [];

    if (orderedSites.length > 0) {
        // From start to first site
        totalDistance += haversineDistance(startPoint, orderedSites[0]);
        // Between sites
        for (let i = 0; i < orderedSites.length - 1; i++) {
            totalDistance += haversineDistance(orderedSites[i], orderedSites[i+1]);
        }
        // From last site back to start
        totalDistance += haversineDistance(orderedSites[orderedSites.length - 1], startPoint);
    }
    
    totalDistance = parseFloat(totalDistance.toFixed(1));
    const totalTime = parseFloat((totalDistance / config.avgSpeedKmh).toFixed(2));
    
    const timePay = totalTime * config.travelTimeRate;
    const distancePay = totalDistance * config.distanceRate;
    const sitePay = orderedSites.length * config.perSiteRate;
    const totalPay = timePay + distancePay + sitePay;
    
    const costPerSite = orderedSites.length > 0 ? totalPay / orderedSites.length : 0;

    if (totalTime > config.maxDailyDriveTime) {
        warnings.push(`Exceeds max drive time of ${config.maxDailyDriveTime} hrs.`);
    }
    if (totalDistance > config.maxDailyDistance) {
        warnings.push(`Exceeds max distance of ${config.maxDailyDistance} km.`);
    }

    return {
        totalDistance,
        totalTime,
        estimatedPay: {
            timePay: parseFloat(timePay.toFixed(2)),
            distancePay: parseFloat(distancePay.toFixed(2)),
            sitePay: parseFloat(sitePay.toFixed(2)),
            total: parseFloat(totalPay.toFixed(2)),
        },
        costPerSite: parseFloat(costPerSite.toFixed(2)),
        warnings,
    };
}


// Simple Nearest Neighbor algorithm for "Fastest Route"
export function findFastestRoute(sites: Site[], startPoint: Point, config: RouteOptimizationConfig): RouteSuggestion {
    let unvisited = [...sites];
    let orderedSites: Site[] = [];
    let currentPoint: Point = startPoint;

    while (unvisited.length > 0) {
        let nearestIndex = -1;
        let minDistance = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
            const distance = haversineDistance(currentPoint, unvisited[i]);
            if (distance < minDistance) {
                minDistance = distance;
                nearestIndex = i;
            }
        }
        
        const nearestSite = unvisited.splice(nearestIndex, 1)[0];
        orderedSites.push(nearestSite);
        currentPoint = nearestSite;
    }
    
    const metrics = calculateRouteMetrics(orderedSites, startPoint, config);
    return {
        mode: 'fastest',
        orderedSites,
        ...metrics
    };
}


// A heuristic for a more "Balanced" route
export function findBalancedRoute(sites: Site[], startPoint: Point, config: RouteOptimizationConfig): RouteSuggestion {
    // For this simulation, the "balanced" route will be the fastest route.
    // A more complex implementation could try to add more sites if time allows,
    // or reorder to cluster sites even if it's not strictly the shortest path.
    // For now, it provides a second option that could diverge with more complex logic.
    const fastestRoute = findFastestRoute(sites, startPoint, config);

    // Example of potential balancing logic: if the fastest route is very short,
    // could we add another nearby site from the general pool? This is complex.
    // For now, we will just return the fastest route but label it as 'balanced'.
    // In a real app, this function would contain different logic.
    const metrics = calculateRouteMetrics(fastestRoute.orderedSites, startPoint, config);
    if(fastestRoute.orderedSites.length < 3 && fastestRoute.totalTime < 2) {
        metrics.warnings.push("Route is very short; consider adding more sites for efficiency.")
    }
    
    return {
        mode: 'balanced',
        orderedSites: fastestRoute.orderedSites,
        ...metrics,
    };
}