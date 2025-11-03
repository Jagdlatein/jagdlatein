import RequireAccess from '../../components/RequireAccess';
import Seo from '../../components/Seo';

const blocks = [
  { title:'Wildkunde', items:['Huftiere','Haarraubwild','Federwild'] },
  { title:'Waffen & Schuss', items:['Sicherheit','Ballistik','Wartung'] },
  { title:'Recht', items:['Deutschland','Österreich','Schweiz'] },
];

export default function QuizHome(){
  return (
    <RequireAccess>
      <>
        <Seo title="Quiz – Jagdlatein" description="Prüfungsnah trainieren – wähle dein Themengebiet." />
        {/* ... Rest wie bisher ... */}
      </>
    </RequireAccess>
  );
}
