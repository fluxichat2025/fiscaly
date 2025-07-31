import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import FocusNFeIntegration from '../components/FocusNFeIntegration';

const EmpresasPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Gerenciamento de Empresas - Focus NFe</title>
        <meta name="description" content="Gerencie suas empresas diretamente na plataforma Focus NFe" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <FocusNFeIntegration height="100vh" />
    </>
  );
};

export default EmpresasPage;