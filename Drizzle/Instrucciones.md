# Instrucciones para correr la demo (Drizzle ORM + MySQL)

Esta demo utiliza **Drizzle ORM** con **MySQL** (a través del driver `mysql2`).

---

## Requisitos previos

- **Node.js 20 o superior** (verificar con `node -v`).
- **npm** (incluido con Node.js).
- Un servidor **MySQL** en funcionamiento (local).

---

## 1. Ubicación de los archivos

El código de la demo de Drizzle se encuentra en:
```
Drizzle/drizzleOrm.ts
```

Este archivo contiene:
- El modelado de tablas y relaciones tanto con **SQL-like API** como con **Relational Query API**.
- La configuración del pool de conexión con MySQL.
- Los bloques de inserción y carga de datos de prueba.
- Las consultas de lectura filtradas (probando ambas APIs).

---

## 2. Inicializar el proyecto (solo si no hay `package.json`)

```bash
npm init -y
npm pkg set type=module
```

---

## 3. Instalar dependencias

```bash
npm install drizzle-orm mysql2
npm install -D drizzle-kit typescript tsx @types/node
```

> [!NOTE]
> Drizzle ORM utiliza el conector nativo `mysql2` (con soporte de promesas) para comunicarse con la base de datos, y `drizzle-kit` como herramienta de línea de comandos para inspección, push de esquemas y visualización gráfica.

Para verificar la versión instalada:
```bash
npx drizzle-kit --version
```

---

## 4. Crear la base de datos

Ingresa a tu cliente de MySQL y crea la base de datos vacía configurada para la demo:

```sql
mysql -u root -p
CREATE DATABASE prueba_drizzle;
EXIT;
```

---

## 5. Configurar credenciales de conexión

Abre el archivo [drizzleOrm.ts](./drizzleOrm.ts) y ajusta las credenciales en la configuración del pool de conexión (líneas 11-16):

```typescript
const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "...", // Coloca aquí la contraseña de tu servidor MySQL local
  database: "prueba_drizzle",
});
```

Ajusta `host`, `user`, `password` y `database` según tu entorno local.

---

## 6. Aplicar el esquema en la base de datos

Para crear las tablas en MySQL a partir del esquema definido en `drizzleOrm.ts`, puedes utilizar `drizzle-kit`:

```bash
npx drizzle-kit push --dialect=mysql --schema=./Drizzle/drizzleOrm.ts
```

Esto creará automáticamente en la base `prueba_drizzle`:
- `usuario`
- `publicacion`
- `etiqueta`
- `publicacion_etiqueta` (tabla intermedia con clave primaria compuesta y claves foráneas).

---

## 7. Ejecutar la demo

Desde la raíz del proyecto:
```bash
npx tsx Drizzle/drizzleOrm.ts
```

*(O si te encuentras dentro del directorio `Drizzle/`: `npx tsx drizzleOrm.ts`)*

> [!TIP]
> **Nota sobre los datos de prueba:**  
> En `drizzleOrm.ts`, los bloques de inserción de datos iniciales se encuentran comentados para evitar duplicar registros en ejecuciones repetidas.
> - En la primera ejecución con la base vacía, descomenta los bloques de inserción dentro de `main()` según indican los comentarios del código para registrar los usuarios (*"Juan"*, *"Pedro"*), etiquetas (*"meme"*, *"programacion"*) y sus publicaciones asociadas.
> - Una vez insertados, vuelve a comentarlos para probar la consulta de lectura tantas veces como desees.

### Ver datos gráficamente en el navegador
```bash
npx drizzle-kit studio --schema=./Drizzle/drizzleOrm.ts
```

---

## Solución de problemas comunes

- **`Access denied for user 'root'@'localhost'`**:  
  La contraseña o el usuario configurados en `mysql.createPool` (`Drizzle/drizzleOrm.ts`) no coinciden con los de tu servidor MySQL local.

- **`Unknown database 'prueba_drizzle'`**:  
  La base de datos aún no fue creada. Ejecuta en MySQL: `CREATE DATABASE prueba_drizzle;`.

- **`Table 'prueba_drizzle.publicacion' doesn't exist`**:  
  No se han creado las tablas en la base de datos. Ejecuta `npx drizzle-kit push --dialect=mysql --schema=./Drizzle/drizzleOrm.ts` antes de ejecutar la consulta.

- **`Cannot find package 'drizzle-orm' o 'mysql2'`**:  
  Falta instalar las dependencias. Ejecuta: `npm install drizzle-orm mysql2`.

- **`ERR_UNKNOWN_FILE_EXTENSION` o error de módulos**:  
  Verifica que `package.json` tenga `"type": "module"` y ejecuta el script utilizando `npx tsx`.
