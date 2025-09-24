import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { mockFacilities, mockCourts, mockBookings } from "../client/src/data/mockData";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Facilities
  app.get('/api/facilities', (_req: Request, res: Response) => {
    res.json(mockFacilities);
  });

  app.get('/api/facilities/:id', (req: Request, res: Response) => {
    const facility = mockFacilities.find(f => f.id === req.params.id);
    if (!facility) return res.status(404).json({ message: 'Facility not found' });
    res.json(facility);
  });

  app.get('/api/facilities/:id/courts', (req: Request, res: Response) => {
    const courts = mockCourts.filter(c => c.facilityId === req.params.id);
    res.json(courts);
  });

  // Bookings (in-memory list extended from mocks)
  const bookings = [...mockBookings];

  app.get('/api/bookings', (req: Request, res: Response) => {
    const { userId } = req.query as { userId?: string };
    const result = userId ? bookings.filter(b => b.userId === userId) : bookings;
    res.json(result);
  });

  app.post('/api/bookings', (req: Request, res: Response) => {
    const { userId, facilityId, courtId, date, timeSlot, totalPrice } = req.body || {};
    if (!userId || !facilityId || !courtId || !date || !timeSlot?.start || !timeSlot?.end) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const id = String(bookings.length + 1);
    const booking = {
      id,
      userId,
      facilityId,
      courtId,
      date,
      timeSlot,
      status: 'confirmed',
      totalPrice: totalPrice ?? 0,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    } as any;
    bookings.push(booking);
    res.status(201).json(booking);
  });

  // Simple in-memory user profiles to satisfy client profile API usage
  type ProfileData = {
    fullName?: string;
    phone?: string;
    address?: string;
    businessName?: string;
    businessAddress?: string;
  };

  const profiles = new Map<string, ProfileData>();

  // Helper to ensure a profile exists with sensible defaults
  function ensureProfile(userId: string): ProfileData {
    if (!profiles.has(userId)) {
      profiles.set(userId, {
        fullName: `User ${userId}`,
        phone: '',
        address: '',
        businessName: '',
        businessAddress: '',
      });
    }
    // non-null assertion is safe because we just set it if missing
    return profiles.get(userId)!;
  }

  // GET user profile
  app.get('/api/profile/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const profile = ensureProfile(userId);
    res.json({ userId, ...profile });
  });

  // PUT user profile (replace)
  app.put('/api/profile/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const body = (req.body || {}) as ProfileData;
    const next: ProfileData = {
      fullName: body.fullName ?? '',
      phone: body.phone ?? '',
      address: body.address ?? '',
      businessName: body.businessName ?? '',
      businessAddress: body.businessAddress ?? '',
    };
    profiles.set(userId, next);
    res.json({ userId, ...next });
  });

  // PATCH user profile (partial update)
  app.patch('/api/profile/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const existing = ensureProfile(userId);
    const update = (req.body || {}) as ProfileData;
    const merged: ProfileData = { ...existing, ...update };
    profiles.set(userId, merged);
    res.json({ userId, ...merged });
  });

  const httpServer = createServer(app);

  return httpServer;
}
