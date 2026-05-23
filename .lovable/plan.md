## JaveCupos — App de movilidad universitaria Javeriana Cali

App real con autenticación, base de datos y rutas navegables, basada en el prototipo HTML enviado.

### Stack
- TanStack Start + Tailwind v4
- Lovable Cloud (auth + base de datos)
- Diseño: navy `#002855`, dorado `#C8973A`, fuentes Syne + Instrument Sans

### Backend (Lovable Cloud)
Tablas:
- `profiles` (id, full_name, email, career, semester, phone, avatar_initials, rating, trips_count)
- `rides` (id, driver_id, origin, destination, departure_time, seats_total, seats_available, price, vehicle, notes, status)
- `ride_requests` (id, ride_id, passenger_id, status)
- `ratings` (id, ride_id, rater_id, rated_id, stars, tags[], comment)

RLS:
- profiles: usuarios ven todos, solo editan el propio
- rides: lectura pública autenticada, conductor crea/edita los suyos
- ride_requests: pasajero crea, conductor y pasajero ven los suyos
- ratings: usuarios autenticados crean, lectura pública

Trigger: auto-crear `profiles` al registro. Validación: solo correo `@javerianacali.edu.co`.

### Rutas
- `/` — Bienvenida (gradiente navy/azul, panel deslizante login/registro)
- `/_authenticated/home` — Hub: saludo, acciones (Ofrecer/Buscar), mini-mapa, viajes disponibles, navbar inferior
- `/_authenticated/publicar` — Form publicar viaje (ruta, hora, cupos, vehículo, precio)
- `/_authenticated/buscar` — Lista de viajes con filtros, click → detalle + solicitar cupo
- `/_authenticated/viaje/$id` — Detalle de viaje (overlay del prototipo) + solicitar
- `/_authenticated/perfil` — Perfil con stats, historial, reviews
- `/_authenticated/calificar/$rideId` — Calificación con estrellas, tags, comentario

### Diseño
Tokens en `src/styles.css`: `--navy`, `--blue`, `--gold`, `--sky`, etc. en oklch. Componentes con look del prototipo (cards redondeadas, gradientes, navbar inferior tipo móvil). Responsive: layout móvil-first (max-w container) ya que el prototipo es de celular.

### Pasos
1. Habilitar Lovable Cloud
2. Migración: tablas + RLS + trigger
3. Sistema de diseño en `src/styles.css`
4. Auth helpers + `_authenticated` guard
5. Rutas: bienvenida, home, publicar, buscar, viaje detalle, perfil, calificar
6. Server functions para rides/requests/ratings
7. Verificar build y navegación