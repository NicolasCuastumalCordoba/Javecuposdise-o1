
CREATE TABLE public.ride_locations (
  ride_id UUID PRIMARY KEY,
  driver_id UUID NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ride_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "locations_select_auth" ON public.ride_locations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "locations_insert_driver" ON public.ride_locations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = driver_id AND auth.uid() IN (SELECT driver_id FROM public.rides WHERE id = ride_id));

CREATE POLICY "locations_update_driver" ON public.ride_locations
  FOR UPDATE TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "locations_delete_driver" ON public.ride_locations
  FOR DELETE TO authenticated
  USING (auth.uid() = driver_id);

ALTER TABLE public.ride_locations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_locations;
