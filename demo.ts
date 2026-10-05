import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client.js";

const prisma = new PrismaClient();

const titulo = (t: string) =>
  console.log(`\n${"=".repeat(50)}\n${t}\n${"=".repeat(50)}`);

async function main() {
  // Limpia datos previos
  await prisma.publicacion.deleteMany();
  await prisma.etiqueta.deleteMany();
  await prisma.usuario.deleteMany();

  // ---------- 01. MODELADO ----------
  titulo("01 · MODELADO: esquema aplicado en la base");
  const tablas = await prisma.$queryRaw<{ tabla: string }[]>`
    SELECT TABLE_NAME AS tabla
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND TABLE_NAME NOT LIKE '\\_%'
  `;
  console.log("Tablas en la base:", tablas.map((t) => t.tabla));

  // ---------- 02. ESCRITURA ----------
  titulo("02 · ESCRITURA: registrar usuarios");

  const ana = await prisma.usuario.create({
    data: {
      nombre: "Ana",
      email: "ana@ejemplo.com",
      edad: 28,
      publicaciones: {
        create: {
          titulo: "Mi primer meme",
          contenido: "jaja",
          publicado: true,
          etiquetas: {
            connectOrCreate: {
              where: { nombre: "meme" },
              create: { nombre: "meme" },
            },
          },
        },
      },
    },
  });
  console.log("Usuario creado:", ana);

  // Un menor de edad con publicación "meme" (no debe aparecer en la búsqueda)
  await prisma.usuario.create({
    data: {
      nombre: "Leo",
      email: "leo@ejemplo.com",
      edad: 15,
      publicaciones: {
        create: {
          titulo: "Meme de Leo",
          publicado: true,
          etiquetas: {
            connectOrCreate: {
              where: { nombre: "meme" },
              create: { nombre: "meme" },
            },
          },
        },
      },
    },
  });

  // Un adulto con publicación SIN etiqueta meme (tampoco debe aparecer)
  await prisma.usuario.create({
    data: {
      nombre: "Marta",
      email: "marta@ejemplo.com",
      edad: 35,
      publicaciones: {
        create: {
          titulo: "Receta de empanadas",
          publicado: true,
          etiquetas: {
            connectOrCreate: {
              where: { nombre: "cocina" },
              create: { nombre: "cocina" },
            },
          },
        },
      },
    },
  });

  console.log("Total de usuarios:", await prisma.usuario.count());

  // Demostración de validación: email duplicado
  try {
    await prisma.usuario.create({
      data: { nombre: "Otra Ana", email: "ana@ejemplo.com", edad: 20 },
    });
  } catch (e: any) {
    console.log(`Email duplicado rechazado (código ${e.code})`);
  }

  // ---------- 03. LECTURA ----------
  titulo('03 · LECTURA: publicaciones con etiqueta "meme" y autor > 18');

  const resultado = await prisma.publicacion.findMany({
    where: {
      etiquetas: { some: { nombre: "meme" } },
      autor: { edad: { gt: 18 } },
    },
    include: { autor: true, etiquetas: true },
  });

  console.table(
    resultado.map((p) => ({
      publicacion: p.titulo,
      autor: p.autor.nombre,
      edad: p.autor.edad,
      etiquetas: p.etiquetas.map((e) => e.nombre).join(", "),
    }))
  );

  console.log(
    "\nEsperado: solo la publicación de Ana (Leo es menor, Marta no tiene 'meme')."
  );
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());