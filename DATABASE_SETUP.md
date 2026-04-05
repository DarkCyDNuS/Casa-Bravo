# Base de datos compartida

La app ya quedo preparada para usar `Supabase` como base de datos compartida.

## 1. Crear proyecto

1. Entra a `https://supabase.com/`
2. Crea un proyecto nuevo
3. Espera a que termine la inicializacion

## 2. Crear la tabla

1. Abre el `SQL Editor`
2. Pega el contenido de [supabase/app_state.sql](H:\Archivos\Descargas\panaderia-runner\supabase\app_state.sql)
3. Ejecuta el script

## 3. Configurar credenciales en la app

1. Copia `.env.example` a `.env`
2. Completa:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Reinicia la aplicacion

## 4. Publicar

Si la subes a Vercel, agrega esas mismas variables en:

- `Project Settings`
- `Environment Variables`

## Como funciona

- La app guarda un estado compartido para clientes, registros, historial y configuracion.
- Cada cambio se sincroniza automaticamente.
- Si otro usuario cambia algo, la app refresca esos datos desde la nube.

## Importante

- La autenticacion actual de usuarios sigue siendo local dentro del frontend.
- Esta solucion es simple y practica para comenzar, pero no es la forma mas segura para una app grande.
- Si despues quieres una version mas profesional, el siguiente paso seria mover usuarios y permisos a `Supabase Auth` y separar los datos en tablas reales.
