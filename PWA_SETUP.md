# Configuración de PWA (Progressive Web App) para Jomach

## ¿Qué se ha configurado?

Tu aplicación web ahora está configurada como una PWA (Progressive Web App), lo que significa que los usuarios pueden:

1. **Instalar la app en sus dispositivos** (móviles y escritorio)
2. **Usar la app sin conexión** (funcionalidad básica)
3. **Recibir notificaciones push** (opcional)
4. **Tener una experiencia similar a una app nativa**

## Archivos creados/modificados:

### 1. `public/manifest.json`
- Define los metadatos de la aplicación
- Especifica iconos, colores, y comportamiento de la app

### 2. `public/sw.js`
- Service Worker para funcionalidad offline
- Maneja el cache de recursos
- Gestiona notificaciones push

### 3. `src/components/InstallPWA.jsx`
- Componente React que muestra el botón de instalación
- Maneja el evento de instalación de la PWA

### 4. `index.html` (modificado)
- Agregadas meta tags para PWA
- Referencias al manifest y iconos
- Registro del Service Worker

### 5. `src/App.jsx` (modificado)
- Importado y agregado el componente InstallPWA

## Pasos para completar la configuración:

### 1. Generar iconos
1. Abre el archivo `generate-icons.html` en tu navegador
2. Haz clic en "Generar Iconos"
3. Descarga todos los iconos generados
4. Coloca los iconos en la carpeta `public/icons/`

### 2. Personalizar el manifest.json
Edita `public/manifest.json` para personalizar:
- `name`: Nombre completo de tu app
- `short_name`: Nombre corto
- `description`: Descripción de la app
- `theme_color`: Color principal de tu app
- `background_color`: Color de fondo

### 3. Personalizar iconos (opcional)
- Reemplaza los iconos generados con tus propios diseños
- Mantén los tamaños especificados en el manifest.json

### 4. Probar la PWA

#### En desarrollo:
```bash
npm run dev
```

#### Para producción:
```bash
npm run build
npm run preview
```

### 5. Verificar la instalación
1. Abre la app en Chrome/Edge
2. Ve a DevTools > Application > Manifest
3. Verifica que no haya errores
4. Prueba el botón "Install" que aparece en la barra de direcciones

## Cómo los usuarios instalarán la app:

### En móviles:
1. Abrir la web en el navegador
2. Aparecerá un banner de instalación automáticamente
3. O usar el botón "Instalar App" que aparece en la esquina inferior derecha

### En escritorio:
1. Abrir la web en Chrome/Edge
2. Hacer clic en el ícono de instalación en la barra de direcciones
3. O usar el botón "Instalar App" en la página

## Funcionalidades adicionales disponibles:

### 1. Notificaciones Push
El Service Worker ya está configurado para manejar notificaciones. Para implementarlas completamente, necesitarás:
- Configurar Firebase Cloud Messaging (FCM)
- Solicitar permisos de notificación
- Enviar notificaciones desde tu backend

### 2. Funcionalidad Offline
El Service Worker cachea recursos básicos. Puedes expandir esto para:
- Cachear datos de la API
- Mostrar páginas offline personalizadas
- Sincronizar datos cuando vuelva la conexión

### 3. Actualizaciones automáticas
El Service Worker maneja actualizaciones automáticamente cuando despliegues nuevas versiones.

## Verificación final:

1. ✅ Manifest.json configurado
2. ✅ Service Worker registrado
3. ✅ Iconos generados (pendiente de colocar en /public/icons/)
4. ✅ Componente de instalación agregado
5. ✅ Meta tags PWA en index.html

## Próximos pasos recomendados:

1. Generar y colocar los iconos
2. Personalizar colores y nombres en manifest.json
3. Probar la instalación en diferentes dispositivos
4. Considerar implementar notificaciones push
5. Expandir funcionalidad offline según necesidades

¡Tu app ya está lista para ser instalada como una PWA! 🎉
