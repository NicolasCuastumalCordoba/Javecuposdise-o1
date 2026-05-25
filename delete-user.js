import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zvhceuqqepcbntmnzqow.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VAJIZd6bcjiOnuGttg2sfg_IcBbAEkN';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function deleteUser() {
  try {
    console.log('🔍 Buscando usuario juan_miguel.perdomo@uao.edu.co...');
    
    // Buscar en la tabla profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'juan_miguel.perdomo@uao.edu.co');
    
    if (profileError) {
      console.error('❌ Error buscando perfil:', profileError);
      return;
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️ No se encontró perfil con ese correo');
      return;
    }
    
    const userId = profiles[0].id;
    console.log(`✅ Perfil encontrado - ID: ${userId}`);
    console.log(`📋 Datos: ${JSON.stringify(profiles[0], null, 2)}`);
    
    // Eliminar el perfil
    console.log('\n🗑️ Eliminando perfil...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (deleteError) {
      console.error('❌ Error eliminando perfil:', deleteError);
      return;
    }
    
    console.log('✅ Perfil eliminado exitosamente');
    console.log('\n📝 Nota: El usuario de Supabase Auth debe eliminarse manualmente desde el dashboard');
    console.log('   O usar la API de Admin de Supabase con la Master Key');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

deleteUser();
