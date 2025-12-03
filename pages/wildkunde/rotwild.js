import Image from "next/image";

export default function Rotwild() {
  return (
    <main style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <h1>Rotwild (Cervus elaphus)</h1>

      <Image
        src="https://images.unsplash.com/photo-1602526216034-b3dfd0f559eb"
        alt="Rotwild Hirsch"
        width={900}
        height={600}
        style={{ borderRadius: "12px", marginBottom: "2rem" }}
      />

      <section>
        <h2>Allgemeines</h2>
        <ul>
          <li>Größtes heimisches Schalenwild</li>
          <li>Gewicht: Hirsch 120–220 kg, Tier 70–120 kg</li>
          <li>Lebensraum: Mittelgebirge, Alpen, große Waldgebiete</li>
          <li>Nahrung: Gräser, Kräuter, Rinde</li>
          <li>Brunftzeit: September / Oktober</li>
        </ul>
      </section>

      <section>
        <h2>Zähne & Gebiss</h2>
        <ul>
          <li>Zahnformel: I 0/3 · C 0/1 · P 3/3 · M 3/3 = 32</li>
          <li>Grandeln im Oberkiefer vorhanden</li>
          <li>Altersschätzung über Abnutzung der Molaren</li>
          <li>Kälber → Milchgebiss</li>
        </ul>
      </section>

      <section>
        <h2>Erkennung</h2>
        <ul>
          <li>Hirsch mit kräftigem Geweih</li>
          <li>Spiegel gelblich-weiß</li>
        </ul>
      </section>

      <section>
        <h2>Quizfragen</h2>
        <ul>
          <li>Wann brunftet das Rotwild?</li>
          <li>Besitzt Rotwild Grandeln?</li>
          <li>Wie lautet die Zahnformel?</li>
        </ul>
      </section>
    </main>
  );
}
