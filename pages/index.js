export async function getServerSideProps() {
  return {
    redirect: {
      destination: "/assignment6",
      permanent: false,
    },
  };
}

export default function Home() {
  return null;
}