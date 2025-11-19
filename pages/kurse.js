export default function Kurse(){
  const kurse = [
    { title:'DE – Jagdschein', desc:'Recht, Wildkunde, Waffen, Praxis.' },
    { title:'AT – Jagdprüfung', desc:'Landesjagdgesetze, Wildbiologie, Praxis.' },
    { title:'CH – Jagdprüfung', desc:'Kantonale Unterschiede, Ethik, Sicherheit.' },
  ];
  return (
    <section className="section">
      <div className="container">
        <h1>Kurse</h1>
        <p>Alle Lernmodule für DE / AT / CH – laufend erweitert.</p>
        <div className="grid">
          {kurse.map((k,i)=>(
            <div className="card" key={i}>
              <h3>{k.title}</h3>
              <p>{k.desc}</p>
              <a className="btn" href="/login">Zum Kurs</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
