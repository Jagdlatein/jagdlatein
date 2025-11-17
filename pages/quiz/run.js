import RequireAccess from '../../components/RequireAccess';
import Seo from '../../components/Seo';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { filterQuestions } from '../../data/questions-full';

export default function QuizRun(){
  const router = useRouter();
  const country = (router.query.country || 'DE').toString().toUpperCase();
  const topic = (router.query.topic || 'Alle').toString();

  const items = useMemo(() => filterQuestions({ country, topic, count: 10 }), [country, topic]);
  const [step, setStep] = useState(0);
  const [given, setGiven] = useState({});
  const [done, setDone] = useState(false);

  ...
      <>
        <Seo title="Quiz starten – Jagdlatein" />
        <section className="page">
          <div className="page-inner">
            ...
          </div>
        </section>
      </>
    </RequireAccess>
  );
}

function hasPaidAccessFromCookies(req) {
  const cookies = req.headers.cookie || "";
  const loggedIn = cookies.includes("jl_session=1");
  const paid = cookies.includes("jl_paid=1");
  return loggedIn && paid;
}

export async function getServerSideProps(ctx) {
  const { req } = ctx;

  // ⛔ ohne Login + Zahlung → redirect auf /login
  if (!hasPaidAccessFromCookies(req)) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { props: {} };
}
