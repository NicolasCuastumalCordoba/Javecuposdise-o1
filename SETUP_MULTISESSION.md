# 🚀 Setup Multi-Sesión - JaveCupos

**Requisito:** Necesitas DOS navegadores o pestañas separadas abiertos

---

## 1️⃣ Prepara el Primer Navegador (Conductor)

### En **Opera** (o el navegador principal):

```bash
npm run dev
# Output: Local: http://localhost:5173
```

- Abre `http://localhost:5173`
- Haz clic en **"Registrarse"**
- Completa con:
  - **Email:** `conductor@javerianacali.edu.co`
  - **Contraseña:** `Test1234!`
  - **Nombre:** `Juan Conductor`
  - **Carrera:** `Ingeniería de Sistemas y Computación`
  - **Semestre:** `5`
  - **Tipo de cuenta:** `🎯 Conductor (ofrecer viajes)`

- Luego haz clic en `http://localhost:5173` en **nueva pestaña o navegador diferente**

---

## 2️⃣ Prepara el Segundo Navegador (Pasajero)

### En **Chrome** (o navegador diferente):

- Abre `http://localhost:5173`
- Haz clic en **"Registrarse"**
- Completa con:
  - **Email:** `pasajero@javerianacali.edu.co`
  - **Contraseña:** `Test1234!`
  - **Nombre:** `María Pasajera`
  - **Carrera:** `Administración de Empresas`
  - **Semestre:** `3`
  - **Tipo de cuenta:** `👤 Usuario (buscar viajes)`

---

## 3️⃣ Test Multi-Sesión Completo

### En el Navegador 1 (Conductor):

1. Ve a **"Publicar"** (ícono `+` en la barra inferior)
2. Llena el formulario:
   - **Origen:** `Javeriana Cali`
   - **Destino:** `Chipichape`
   - **Hora:** Mañana a las `10:00 AM`
   - **Asientos:** `3`
   - **Precio:** `5000`
   - **Vehículo:** `Chevrolet Spark Rojo`
3. Haz clic en **"Publicar viaje"**
4. ✅ Deberías ver el viaje en tu perfil

### En el Navegador 2 (Pasajero):

1. Ve a **"Buscar"** (ícono de lupa)
2. Busca viajes con:
   - **Origen:** `Javeriana`
   - **Destino:** `Chipichape`
3. ✅ Deberías ver el viaje que publicó el Conductor
4. Haz clic en el viaje
5. Haz clic en **"Solicitar viaje"**
6. ✅ Deberías ver el mensaje de solicitud enviada

### De Vuelta en el Navegador 1 (Conductor):

1. Ve a **"Inicio"** (primer ícono)
2. Baja a la sección **"Solicitudes"**
3. ✅ **IMPORTANTE:** Deberías ver la solicitud de María Pasajera
4. Puedes hacer clic en el viaje para ver las solicitudes detalladas

---

## ✅ Checklist Final

- [ ] **Opera + Chrome abiertos** simultáneamente
- [ ] Conductor logueado en Opera
- [ ] Pasajero logueado en Chrome
- [ ] Conductor puede publicar viajes
- [ ] Pasajero ve el viaje en tiempo real
- [ ] Solicitudes aparecen en Inicio del Conductor
- [ ] El logout de uno **NO afecta** al otro

---

## 🐛 Si Algo No Funciona

### Problema: No aparece el viaje en el navegador del pasajero

**Solución:**
1. Recarga la página del Pasajero (F5)
2. Si sigue sin aparecer, verifica que:
   - Ambos están logueados ✓
   - El viaje tiene `status: 'active'` ✓
   - La hora es `>= now` ✓

### Problema: No aparece la solicitud en el Conductor

**Solución:**
1. Recarga la página del Conductor (F5)
2. Verifica en DevTools que el `ride_requests` se sincroniza:
   - Abre DevTools (F12)
   - Pestaña **"Network"**
   - Busca requests POST a `/rest/v1/ride_requests`

### Problema: Sesión del primer navegador se cierra

**Esto NO debería pasar**, pero si ocurre:
1. Limpia localStorage:
   - DevTools → Application → LocalStorage
   - Elimina claves `sb-*`
2. Recarga ambos navegadores
3. Reinicia con el checklist

---

## 📊 Datos de Prueba Predefinidos

Si quieres datos de prueba más rápido, usa estos:

```
Conductores Disponibles:
- conductor1@javerianacali.edu.co / Test1234!
- driver@javerianacali.edu.co / Test1234!

Pasajeros Disponibles:
- passenger@javerianacali.edu.co / Test1234!
- user@javerianacali.edu.co / Test1234!
```

---

## 🎯 Próximos Tests Avanzados

Una vez funcione lo básico, prueba:

1. **Cambiar de rol:**
   - Ve a Perfil → Cambiar rol
   - El rol se actualiza en tiempo real en ambas sesiones

2. **Cancelar solicitud:**
   - En Pasajero: Ve a Inicio → Solicitudes
   - Cancela la solicitud
   - El Conductor lo ve en tiempo real

3. **Calificar viaje:**
   - Después de que el Conductor acepte
   - Ambos pueden calificarse mutuamente

---

## 📝 Notas

- Los datos se sincronizan en **tiempo real** (Real-time Subscriptions)
- Puedes mantener ambas sesiones abiertas **indefinidamente**
- Las métricas (viajes, rating) se actualizan automáticamente
- No hay límite de sesiones simultáneas (puedes probar con 3+ navegadores)

---

**¡Listo! A probar! 🚀**
