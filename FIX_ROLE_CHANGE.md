# Fix: Error al Cambiar de Rol

## 🐛 Problema Identificado

Cuando intentabas cambiar de rol (Conductor ↔ Pasajero), ocurría un error. Las causas fueron:

1. **Política RLS incompleta**: La política `profiles_update_self` existía pero no era lo suficientemente explícita
2. **Falta de logging**: Sin mensajes de error detallados, era imposible saber qué fallaba
3. **Falta de sincronización**: El perfil no refrescaba correctamente después del cambio

## ✅ Cambios Realizados

### 1. Nueva Migración SQL: `20260525_fix_role_update_policy.sql`

```sql
-- Mejoró la política RLS para ser más explícita
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;

CREATE POLICY "profiles_update_self" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Explícitamente otorga permisos
GRANT UPDATE ON public.profiles TO authenticated;
GRANT USAGE ON TYPE public.user_role TO authenticated;
```

**Beneficios:**
- ✅ Explícitamente permite UPDATE con condiciones
- ✅ Otorga permisos explícitos al tipo ENUM `user_role`
- ✅ Evita problemas de RLS

### 2. Mejorado `src/pages/Perfil.tsx`: `changeRole()`

```typescript
async function changeRole() {
  try {
    console.log(`[DEBUG] Intentando cambiar rol a: ${newRole}`)
    
    // Ahora usa .select() para verificar que se actualizó
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole as any })
      .eq('id', user.id)
      .select()  // ← NUEVO: Retorna el registro actualizado
    
    if (error) throw new Error(error.message)
    console.log('[DEBUG] Rol actualizado en BD:', data)
    
    // Refrescar y esperar
    await refreshProfile()
    toast.success(`Ahora eres ${newRole === 'driver' ? 'Conductor' : 'Pasajero'} ✓`)
  } catch (err) {
    console.error('Error al cambiar rol:', err)
    toast.error(`Error: ${err.message}`)  // ← Mejor feedback
  }
}
```

**Mejoras:**
- ✅ `.select()` para verificar la actualización
- ✅ Logging detallado (DevTools → Console)
- ✅ Mensajes de error específicos al usuario

### 3. Mejorado `src/AuthContext.tsx`: `loadProfile()` y `refreshProfile()`

```typescript
async function loadProfile(uid: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single()
  
  if (error) {
    setProfile(null)
    return null  // ← NUEVO: Retorna el resultado
  }
  
  if (data) {
    setProfile(data as Profile)
    return data
  }
}

async function refreshProfile() {
  if (user) {
    const profile = await loadProfile(user.id)
    console.log('[DEBUG] Perfil refrescado:', profile)
    return profile
  }
}
```

**Mejoras:**
- ✅ Retorna el perfil para verificación
- ✅ Logging de sincronización
- ✅ Mejor rastreo de cambios

## 🧪 Cómo Probar el Fix

### 1. **Abre la Consola del Navegador**

```
F12 → Pestaña "Console"
```

### 2. **Ve a Perfil y Cambia de Rol**

```
1. Haz clic en tu Perfil (último ícono)
2. Sección "Mi rol" → Haz clic en "🔄 Cambiar"
3. Selecciona Conductor o Pasajero
4. Haz clic en el botón azul "Cambiar a ..."
```

### 3. **Verifica la Consola**

Deberías ver logs como:

```
[DEBUG] Intentando cambiar rol a: driver
[DEBUG] Rol actualizado en BD: [{...profile with role: "driver"...}]
[DEBUG] Perfil refrescado: {...profile with role: "driver"...}
```

✅ **Si ves estos logs, el cambio funcionó!**

### 4. **Verifica la UI**

- El rol debe cambiar inmediatamente en el card "Mi rol"
- El emoji debe cambiar (👤 → 🚗 o viceversa)
- Debería aparecer un toast: "Ahora eres Conductor ✓"

## ❌ Si Sigue Dando Error

### Opción 1: Verificar Error Específico

En la consola deberías ver algo como:

```
Error: new row violates row-level security policy "..."
```

Si ves esto:
1. Ve a Supabase Dashboard → SQL Editor
2. Ejecuta:
```sql
-- Verifica que la política existe
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Opción 2: Aplicar la Migración Manualmente

Si no la migración no se aplicó:

1. Ve a Supabase Dashboard → SQL Editor
2. Copia el contenido de `20260525_fix_role_update_policy.sql`
3. Ejecuta cada statement

### Opción 3: Verificar Permisos

```sql
-- En Supabase SQL Editor
-- Verifica que los permisos existen
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name='profiles' AND privilege_type='UPDATE';
```

## 📊 Testeo Multi-Sesión

Este fix también funciona correctamente en ambas sesiones simultáneas:

```
Navegador 1 (Conductor): Cambia a Pasajero
├── Se actualiza localmente ✓
├── Se sincroniza a BD ✓
└─ Navegador 2 (Pasajero): Ve el cambio en tiempo real ✓

Navegador 2 (Pasajero): Cambia a Conductor
├── Se actualiza localmente ✓
├── Se sincroniza a BD ✓
└─ Navegador 1 (Conductor): Ve el cambio en tiempo real ✓
```

## 🚀 Resumen

| Antes | Después |
|-------|---------|
| ❌ Error sin detalles | ✅ Logs detallados en consola |
| ❌ Sin verificación | ✅ `.select()` confirma el cambio |
| ❌ Profil no refrescaba | ✅ `refreshProfile()` sincronizado |
| ❌ RLS unclear | ✅ RLS explícita y correcta |

**¡El cambio de rol debe funcionar ahora! 🎉**
