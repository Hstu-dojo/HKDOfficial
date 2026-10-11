/** User-supplied credentials checked against the official BKF DAN Holder List. */
import dotenv from "dotenv";
import postgres from "postgres";
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });
const records = [
  {
    name: "Shahriar Hasan",
    aliases: ["Shahriar Hasan"],
    registration: "BKF018642",
    belt: "D03135",
  },
  {
    name: "Mst. Nisha Akter",
    aliases: ["Mst. Nisha Akter"],
    registration: "BKF018711",
    belt: "D03155",
  },
  {
    name: "Nowrin Ahmed Shimonti",
    aliases: ["Nowrin Ahmed Shimonti"],
    registration: "BKF018709",
    belt: "D03157",
  },
  {
    name: "Rojnil Richil",
    aliases: ["Rojnil Ritchil", "Rojnil Richil"],
    registration: "BKF018675",
    belt: "D03139",
  },
];
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
  });
  try {
    await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(654321029)`;
      for (const record of records) {
        const people =
          await tx`SELECT id,translations FROM academy_people WHERE lower(translations->'en'->>'name') IN ${tx(record.aliases.map((name) => name.toLowerCase()))} FOR UPDATE`;
        if (people.length !== 1)
          throw new Error(
            `Expected exactly one academy profile for ${record.name}; found ${people.length}`,
          );
        const person = people[0];
        const translations = person.translations;
        if (record.name === "Rojnil Richil")
          for (const copy of Object.values(translations) as { name?: string }[])
            if (copy.name && record.aliases.includes(copy.name))
              copy.name = record.name;
        await tx`UPDATE academy_people SET bkf_registration_no=${record.registration},black_belt_no=${record.belt},translations=${tx.json(translations)},updated_at=now() WHERE id=${person.id}`;
      }
    });
    console.log(
      "Updated all four existing academy profiles with BKF credentials; corrected Rojnil Richil in each locale.",
    );
  } finally {
    await sql.end();
  }
}
main().catch((error) => {
  console.error("BKF profile update failed:", error.message);
  process.exitCode = 1;
});
