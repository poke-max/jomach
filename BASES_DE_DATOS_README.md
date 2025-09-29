# 📊 Bases de Datos - Empleos, Alquileres y Publicidad

## 🏗️ Estructura Implementada

### 1. **Empleos (jobs)** - Ya existía
- Colección: `jobs`
- Servicio: `jobsService`

### 2. **Alquileres (rents)** - ✅ NUEVO
- Colección: `rents`
- Servicio: `rentsService`

### 3. **Publicidad (ads)** - ✅ NUEVO
- Colección: `ads`
- Servicio: `adsService`

## 📋 Campos de Alquileres (rents)

```javascript
{
  id: "rentId",
  city: "Asuncion",
  description: "Gestionar las ventas.",
  direction: "Fernando de la Mora, 7878",
  email: "jafloresb@fctunca.edu.py",
  phoneNumber: "",
  price: "5000000-6000000",
  status: "disponible",
  tags: "",
  title: "",
  type: "Alquiler",
  ubication: {
    lat: -25.301625590361116,
    lng: -57.58906832685852
  },
  url: "https://firebasestorage.googleapis.com/...",
  vacancies: "3",
  website: "",
  likes: 0,
  views: 0,
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: "userId"
}
```

## 📋 Campos de Publicidad (ads)

```javascript
{
  id: "adId",
  title: "Título del anuncio",
  description: "Descripción del anuncio",
  company: "Empresa anunciante",
  city: "Ciudad",
  direction: "Dirección",
  email: "contacto@empresa.com",
  phoneNumber: "+595123456789",
  website: "https://empresa.com",
  price: "Precio del producto/servicio",
  tags: "marketing, publicidad, digital",
  type: "Publicidad",
  status: "activo",
  url: "https://firebasestorage.googleapis.com/...",
  ubication: {
    lat: -25.2637,
    lng: -57.5759
  },
  likes: 0,
  views: 0,
  clicks: 0, // Específico para publicidad
  isActive: true,
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: "userId"
}
```

## 🔧 Servicios Disponibles

### Para Alquileres (rentsService)
```javascript
import { rentsService } from '../firebase/services';

// Suscribirse a alquileres en tiempo real
const unsubscribe = rentsService.subscribeToRents((rents) => {
  console.log('Alquileres:', rents);
});

// Agregar nuevo alquiler
const rentData = {
  city: "Asuncion",
  description: "Casa amplia con jardín",
  direction: "Av. España 1234",
  email: "contacto@ejemplo.com",
  phoneNumber: "+595123456789",
  price: "2000000-3000000",
  status: "disponible",
  title: "Casa en alquiler",
  type: "Alquiler",
  createdBy: currentUser.uid
};

const rentId = await rentsService.addRent(rentData);

// Otras operaciones
await rentsService.updateRent(rentId, updatedData, userId);
await rentsService.deleteRent(rentId, userId);
await rentsService.likeRent(rentId, userId);
await rentsService.toggleRentStatus(rentId, userId);
```

### Para Publicidad (adsService)
```javascript
import { adsService } from '../firebase/services';

// Suscribirse a anuncios en tiempo real
const unsubscribe = adsService.subscribeToAds((ads) => {
  console.log('Anuncios:', ads);
});

// Agregar nuevo anuncio
const adData = {
  title: "Promoción especial",
  description: "Descuento del 50% en todos los productos",
  company: "Mi Empresa",
  city: "Asuncion",
  email: "marketing@empresa.com",
  phoneNumber: "+595987654321",
  website: "https://miempresa.com",
  type: "Publicidad",
  createdBy: currentUser.uid
};

const adId = await adsService.addAd(adData);

// Registrar click en anuncio (para métricas)
await adsService.clickAd(adId);

// Otras operaciones
await adsService.updateAd(adId, updatedData, userId);
await adsService.deleteAd(adId, userId);
await adsService.likeAd(adId, userId);
await adsService.toggleAdStatus(adId, userId);
```

## 👤 Servicios de Usuario Actualizados

```javascript
import { usersService } from '../firebase/services';

// Obtener alquileres publicados por el usuario
const userRents = await usersService.getUserPublishedRents(userId);

// Obtener anuncios publicados por el usuario
const userAds = await usersService.getUserPublishedAds(userId);

// Obtener empleos publicados por el usuario (ya existía)
const userJobs = await usersService.getUserPublishedJobs(userId);
```

## 🔒 Seguridad y Reglas

### Firestore Rules
- ✅ Reglas agregadas para `rents` y `ads`
- ✅ Lectura pública, escritura solo para usuarios autenticados

### Storage Rules
- ✅ Reglas agregadas para imágenes de alquileres (`/rents/`)
- ✅ Reglas agregadas para imágenes de publicidad (`/ads/`)

### Índices
- ✅ Índices compuestos agregados para `rents` y `ads`
- ✅ Optimización para consultas por `isActive` y `createdAt`

## 🚀 Próximos Pasos

1. **Crear componentes de UI** para publicar alquileres y publicidad
2. **Adaptar componentes existentes** como `PublishJobScreen` para los nuevos tipos
3. **Implementar filtros** específicos para cada tipo de publicación
4. **Crear vistas separadas** para empleos, alquileres y publicidad
5. **Implementar búsqueda** específica por tipo de publicación

## 📱 Integración con la App

Los servicios están listos para ser utilizados en los componentes React. Puedes:

1. Importar los servicios: `import { rentsService, adsService } from '../firebase/services'`
2. Usar los hooks existentes como base para crear hooks específicos
3. Adaptar los componentes de UI existentes para manejar los nuevos tipos
4. Implementar navegación entre diferentes tipos de publicaciones

¡Todas las bases de datos están configuradas y listas para usar! 🎉
