import { supabase } from './supabase';

// ============================================
// PARKING ZONES
// ============================================
export async function getZones() {
    const { data, error } = await supabase
        .from('parking_zones')
        .select('*')
        .order('zone_code');
    return { data: data || [], error };
}

export async function updateZone(id, updates) {
    const { data, error } = await supabase
        .from('parking_zones')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    return { data, error };
}

// ============================================
// CHARGING STATIONS
// ============================================
export async function getStations(zoneId = null) {
    let query = supabase.from('charging_stations').select('*, parking_zones(name, zone_code)');
    if (zoneId) query = query.eq('zone_id', zoneId);
    const { data, error } = await query.order('station_code');
    return { data: data || [], error };
}

export async function getAvailableStations(zoneId = null) {
    let query = supabase
        .from('charging_stations')
        .select('*, parking_zones(name, zone_code, price_per_kwh)')
        .eq('status', 'available');
    if (zoneId) query = query.eq('zone_id', zoneId);
    const { data, error } = await query.order('station_code');
    return { data: data || [], error };
}

export async function updateStationStatus(id, status) {
    const { data, error } = await supabase
        .from('charging_stations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    return { data, error };
}

// ============================================
// VEHICLES
// ============================================
export async function getUserVehicles(userId) {
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return { data: data || [], error };
}

export async function createVehicle(vehicle) {
    const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicle)
        .select()
        .single();
    return { data, error };
}

// ============================================
// CHARGING SESSIONS
// ============================================
export async function getAllSessions(filters = {}) {
    let query = supabase
        .from('charging_sessions')
        .select('*, vehicles(license_plate, make_model, owner_name), charging_stations(station_code), parking_zones(name, zone_code)')
        .order('created_at', { ascending: false });

    if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
    }
    if (filters.zone) {
        query = query.eq('zone_id', filters.zone);
    }
    if (filters.limit) {
        query = query.limit(filters.limit);
    }
    const { data, error } = await query;
    return { data: data || [], error };
}

export async function getUserSessions(userId) {
    const { data, error } = await supabase
        .from('charging_sessions')
        .select('*, vehicles(license_plate, make_model), charging_stations(station_code), parking_zones(name, zone_code)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return { data: data || [], error };
}

export async function getSessionByCode(sessionCode) {
    const { data, error } = await supabase
        .from('charging_sessions')
        .select('*, vehicles(license_plate, make_model, owner_name), charging_stations(station_code, max_power_kw), parking_zones(name, zone_code, price_per_kwh)')
        .eq('session_code', sessionCode)
        .single();
    return { data, error };
}

export async function createSession(session) {
    const { data, error } = await supabase
        .from('charging_sessions')
        .insert(session)
        .select()
        .single();
    return { data, error };
}

export async function updateSession(id, updates) {
    const { data, error } = await supabase
        .from('charging_sessions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    return { data, error };
}

// ============================================
// DASHBOARD STATS (aggregated)
// ============================================
export async function getDashboardStats() {
    // Active sessions count
    const { count: activeSessions } = await supabase
        .from('charging_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'charging');

    // Total chargers
    const { count: totalChargers } = await supabase
        .from('charging_stations')
        .select('*', { count: 'exact', head: true });

    // Active chargers
    const { count: activeChargers } = await supabase
        .from('charging_stations')
        .select('*', { count: 'exact', head: true })
        .in('status', ['charging', 'available']);

    // Today's sessions for energy & revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: todaySessions } = await supabase
        .from('charging_sessions')
        .select('energy_delivered_kwh, total_cost')
        .gte('created_at', today.toISOString());

    const totalEnergy = (todaySessions || []).reduce((sum, s) => sum + (Number(s.energy_delivered_kwh) || 0), 0);
    const revenue = (todaySessions || []).reduce((sum, s) => sum + (Number(s.total_cost) || 0), 0);

    // Queued sessions for avg wait
    const { data: queuedSessions } = await supabase
        .from('charging_sessions')
        .select('created_at, start_time')
        .eq('status', 'queued');

    const avgWaitTime = queuedSessions?.length > 0
        ? Math.round(queuedSessions.reduce((sum, s) => {
            const wait = s.start_time ? (new Date(s.start_time) - new Date(s.created_at)) / 60000 : 0;
            return sum + wait;
        }, 0) / queuedSessions.length)
        : 0;

    return {
        activeSessions: activeSessions || 0,
        totalChargers: totalChargers || 0,
        activeChargers: activeChargers || 0,
        totalEnergy: Math.round(totalEnergy * 10) / 10,
        revenue: Math.round(revenue),
        avgWaitTime,
    };
}

// ============================================
// GRID METRICS
// ============================================
export async function getGridMetrics(hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
        .from('grid_metrics')
        .select('*')
        .gte('timestamp', since)
        .order('timestamp');
    return { data: data || [], error };
}

export async function insertGridMetric(metric) {
    const { data, error } = await supabase
        .from('grid_metrics')
        .insert(metric)
        .select()
        .single();
    return { data, error };
}

// ============================================
// NOTIFICATIONS
// ============================================
export async function getNotifications(userId = null, limit = 20) {
    let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (userId) {
        query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }
    const { data, error } = await query;
    return { data: data || [], error };
}

export async function markNotificationRead(id) {
    const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
    return { data, error };
}

export async function createNotification(notification) {
    const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();
    return { data, error };
}

// ============================================
// SYSTEM SETTINGS
// ============================================
export async function getSettings() {
    const { data, error } = await supabase
        .from('system_settings')
        .select('*');

    // Convert array to key-value object
    const settings = {};
    (data || []).forEach(s => {
        try {
            settings[s.key] = JSON.parse(s.value);
        } catch {
            settings[s.key] = s.value;
        }
    });
    return { data: settings, error };
}

export async function updateSetting(key, value) {
    const { data, error } = await supabase
        .from('system_settings')
        .update({ value: JSON.stringify(value), updated_at: new Date().toISOString() })
        .eq('key', key);
    return { data, error };
}

// ============================================
// AI INSIGHTS
// ============================================
export async function getAIInsights() {
    const { data, error } = await supabase
        .from('ai_insights')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
    return { data: data || [], error };
}

// ============================================
// BOOKING HELPER — full charge request flow
// ============================================
export async function bookChargingSession({
    userId,
    vehicleModel,
    licensePlate,
    currentCharge,
    targetCharge,
    shoppingDuration,
    preferredZone,
    priority,
    phone,
}) {
    // 1. Create or find vehicle
    let vehicle;
    const { data: existingVehicle } = await supabase
        .from('vehicles')
        .select('*')
        .eq('license_plate', licensePlate)
        .eq('user_id', userId)
        .maybeSingle();

    if (existingVehicle) {
        vehicle = existingVehicle;
    } else {
        const { data: newVehicle, error: vErr } = await createVehicle({
            license_plate: licensePlate,
            make_model: vehicleModel,
            owner_name: '',
            owner_phone: phone,
            user_id: userId,
        });
        if (vErr) return { data: null, error: vErr };
        vehicle = newVehicle;
    }

    // 2. Find available station
    let stationQuery = supabase
        .from('charging_stations')
        .select('*, parking_zones(id, name, zone_code, price_per_kwh)')
        .eq('status', 'available');

    if (preferredZone && preferredZone !== 'any') {
        const zoneMap = { a: 'A', b: 'B', c: 'C', d: 'D' };
        const { data: zone } = await supabase
            .from('parking_zones')
            .select('id')
            .eq('zone_code', zoneMap[preferredZone] || preferredZone)
            .single();
        if (zone) stationQuery = stationQuery.eq('zone_id', zone.id);
    }

    const { data: stations } = await stationQuery.limit(1);
    if (!stations || stations.length === 0) {
        return { data: null, error: { message: 'No available stations. Please try again later.' } };
    }

    const station = stations[0];

    // 3. Generate session code
    const sessionCode = `CS-${Math.floor(Math.random() * 9000 + 1000)}`;

    // 4. Create session
    const estimatedKwh = ((targetCharge - currentCharge) / 100) * 40; // rough estimate
    const pricePerKwh = station.parking_zones?.price_per_kwh || 29;
    const estimatedCost = Math.round(estimatedKwh * pricePerKwh);

    const { data: session, error: sErr } = await createSession({
        session_code: sessionCode,
        vehicle_id: vehicle.id,
        station_id: station.id,
        zone_id: station.zone_id,
        user_id: userId,
        status: 'queued',
        priority: priority === 'standard' ? 'medium' : priority,
        start_charge_percent: currentCharge,
        target_charge_percent: targetCharge,
        current_charge_percent: currentCharge,
        total_cost: estimatedCost,
        shopping_duration_minutes: Math.round(parseFloat(shoppingDuration) * 60),
        start_time: new Date().toISOString(),
        estimated_end_time: new Date(Date.now() + parseFloat(shoppingDuration) * 60 * 60 * 1000).toISOString(),
    });

    if (sErr) return { data: null, error: sErr };

    // 5. Mark station as occupied
    await updateStationStatus(station.id, 'charging');

    return {
        data: {
            sessionCode,
            station: station.station_code,
            zone: station.parking_zones?.name,
            estimatedCost,
            ...session,
        },
        error: null,
    };
}
