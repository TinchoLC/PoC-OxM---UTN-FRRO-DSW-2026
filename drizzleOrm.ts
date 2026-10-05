
// Modelado (Definición de esquema) con SQL like api

import { drizzle } from "drizzle-orm/mysql2";
import { relations, and, eq, gt } from "drizzle-orm";
import mysql from "mysql2/promise";

import {mysqlTable,int,varchar,text,
      boolean,timestamp,primaryKey,} from "drizzle-orm/mysql-core";

const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "...", //Contraseña de cada usuario
  database: "prueba_drizzle",
});

export const usuario = mysqlTable("usuario", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  edad: int("edad").notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
});

export const publicacion = mysqlTable("publicacion", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  contenido: text("contenido").notNull(),
  publicado: boolean("publicado").default(false).notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),

  usuarioId: int("usuario_id")
    .notNull()
    .references(() => usuario.id),
});

export const etiqueta = mysqlTable("etiqueta", {
  id: int("id").autoincrement().primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
});

export const publicacionEtiqueta = mysqlTable(
  "publicacion_etiqueta",
  {
    publicacionId: int("publicacion_id")
      .notNull()
      .references(() => publicacion.id),

    etiquetaId: int("etiqueta_id")
      .notNull()
      .references(() => etiqueta.id),
  },
  (table) => [
    primaryKey({
      columns: [table.publicacionId, table.etiquetaId],
    }),
  ],
);

// Modelado con relational query api

export const usuarioRelations = relations(usuario, 
  ({ many }) => ({
  publicaciones: many(publicacion),
}));

export const publicacionRelations = relations(
  publicacion,
  ({ one, many }) => ({
    autor: one(usuario, {
      fields: [publicacion.usuarioId],
      references: [usuario.id],
    }),
    publicacionesEtiquetas: many(publicacionEtiqueta),
  }),
);

export const etiquetaRelations = relations(etiqueta, 
  ({ many }) => ({
  publicacionesEtiquetas: many(publicacionEtiqueta),
}));

export const publicacionEtiquetaRelations = relations(
  publicacionEtiqueta,
  ({ one }) => ({
    publicacion: one(publicacion, {
      fields: [publicacionEtiqueta.publicacionId],
      references: [publicacion.id],
    }),
    etiqueta: one(etiqueta, {
      fields: [publicacionEtiqueta.etiquetaId],
      references: [etiqueta.id],
    }),
  }),
);


const schema = {
  usuario,publicacion,
  etiqueta,publicacionEtiqueta,
  usuarioRelations,publicacionRelations,
  etiquetaRelations,publicacionEtiquetaRelations,
};

const db = drizzle(connection, 
  {schema,
  mode: "default",
  }
);

//Registrar usuario con SQL LIKE API      (Ya está comentando porque ya cree el usuario y las otros datos, descomentar para crear los usuarios)
/*async function main() {
  await db.insert(usuario).values({
    nombre: "Juan",
    email: "juan@gmail.com",
    edad: 20,
  });

  console.log("Usuario registrado");*/

// Lectura memes y autor mayor a 18 años

async function main() {
/*
  // Carga de datos para probar la busqueda

  //Pedro - 17 años
  await db.insert(usuario).values({
    nombre: "Pedro",
    email: "pedro@gmail.com",
    edad: 17,
  });

  //Etiquetas
  await db.insert(etiqueta).values([
    { nombre: "meme" },
    { nombre: "programacion" },
  ]);

  //Publicaciones
  await db.insert(publicacion).values([
    {
      titulo: "Meme de SQL",
      contenido: "Cuando te olvidás el WHERE",
      publicado: true,
      usuarioId: 1, // Juan
    },
    {
      titulo: "Aprendiendo Drizzle",
      contenido: "Probando Drizzle ORM",
      publicado: true,
      usuarioId: 1, // Juan
    },
    {
      titulo: "Otro meme",
      contenido: "Un meme publicado por Pedro",
      publicado: true,
      usuarioId: 2, // Pedro
    },
  ]);

  //Relación Publicacion con Etiqueta
  await db.insert(publicacionEtiqueta).values([
    {
      publicacionId: 1,
      etiquetaId: 1, // Meme de SQL -> meme
    },
    {
      publicacionId: 2,
      etiquetaId: 2, // Aprendiendo Drizzle -> programacion
    },
    {
      publicacionId: 3,
      etiquetaId: 1, // Otro meme -> meme
    },
  ]);
  console.log("Datos cargados correctamente");*/

    //Búsqueda por Criterio (Buscar publicaciones con etiqueta “meme” y autor mayor a 18 años) SQL Like Api
    //Prueba de la búsqueda con SQL like api
    console.log("Consulta con SQL like api");
    const resultado = await db
    .select({
      publicacion: publicacion.titulo,
      autor: usuario.nombre,
      edad: usuario.edad,
      etiqueta: etiqueta.nombre,
    })
    .from(publicacion)
    .innerJoin(
      usuario,
      eq(publicacion.usuarioId, usuario.id)
    )
    .innerJoin(
      publicacionEtiqueta,
      eq(publicacion.id, publicacionEtiqueta.publicacionId)
    )
    .innerJoin(
      etiqueta,
      eq(publicacionEtiqueta.etiquetaId, etiqueta.id)
    )
    .where(
      and(
        eq(etiqueta.nombre, "meme"),
        gt(usuario.edad, 18)
      )
    );
    console.log(resultado);


    //Prueba de la búsqueda con relational query api
    console.log("Consulta con relational query api");
    const publicaciones = await db.query.publicacion.findMany({
      with: {
        autor: true,
        publicacionesEtiquetas: {
          with: {
            etiqueta: true,
          },
        },
      },
    });

    const resultadoRelational = publicaciones
      .filter(
        (pub) =>
          pub.autor.edad > 18 &&
          pub.publicacionesEtiquetas.some(
            (pe) => pe.etiqueta.nombre === "meme"
          )
      )
      .map((pub) => ({
        publicacion: pub.titulo,
        autor: pub.autor.nombre,
        edad: pub.autor.edad,
        etiqueta: "meme",
      }));

    console.log(resultadoRelational);
}

main();