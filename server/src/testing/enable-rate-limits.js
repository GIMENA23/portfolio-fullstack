// Importar ESTE archivo primero en un test que quiera ver los límites de pedidos funcionando.
// Tiene que evaluarse antes de cargar la app (los límites se arman al definir las rutas).
process.env.TEST_RATE_LIMITS = '1';
