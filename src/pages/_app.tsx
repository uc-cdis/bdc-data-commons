import App, { AppProps, AppContext, AppInitialProps } from 'next/app';
import React, { useState,useEffect, useMemo, useRef ,Suspense} from 'react';
import { MantineProvider } from '@mantine/core';
import { Faro, FaroErrorBoundary, withFaroProfiler } from '@grafana/faro-react';
import { initGrafanaFaro } from '../lib/Grafana/grafana';


import {
  Gen3Provider,
  TenStringArray,
  type ModalsConfig,
  RegisteredIcons,
  Fonts,
  createMantineTheme,
  SessionConfiguration,
  // registerCohortDiscoveryApp,
  registerCohortBuilderDefaultPreviewRenderers,
  registerMetadataSchemaApp,
} from '@gen3/frontend';

import { registerCohortTableCustomCellRenderers } from '@/lib/CohortBuilder/CustomCellRenderers';
import { registerCustomExplorerDetailsPanels } from '@/lib/CohortBuilder/FileDetailsPanel';

import '../styles/globals.css';
import '@fontsource/montserrat';
import '@fontsource/source-sans-pro';
import '@fontsource/poppins';

import { setDRSHostnames } from '@gen3/core';
import drsHostnames from '../../config/drsHostnames.json';
import { loadContent } from '@/lib/content/loadContent';
import Loading from '../components/Loading';

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const ReactDOM = require('react-dom');
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  const axe = require('@axe-core/react');
  axe(React, ReactDOM, 1000);
}

interface Gen3AppProps {
  colors: Record<string, TenStringArray>;
  icons: Array<RegisteredIcons>;
  themeFonts: Fonts;
  modalsConfig: ModalsConfig;
  sessionConfig: SessionConfiguration;
}

const Gen3App = ({
                   Component,
                   pageProps,
                   colors,
                   icons,
                   themeFonts,
                   sessionConfig,
                   modalsConfig,
                 }: AppProps & Gen3AppProps) => {
  useEffect(() => {
    setDRSHostnames(drsHostnames);
  }, []);

  const faroRef = useRef<null | Faro>(null);

  useEffect(() => {
    // one time init
    // if (
    //   process.env.NEXT_PUBLIC_FARO_COLLECTOR_URL &&
    //   process.env.NEXT_PUBLIC_FARO_APP_ENVIRONMENT != "local" &&
    //   !faroRef.current
    // ) {
    if (!faroRef.current) faroRef.current = initGrafanaFaro();
    //  registerCohortDiscoveryApp();
    registerMetadataSchemaApp();
    registerCohortBuilderDefaultPreviewRenderers();
    registerCohortTableCustomCellRenderers();
    registerCustomExplorerDetailsPanels();
    // }
  }, []);


  const theme = useMemo(
    () => createMantineTheme(themeFonts, colors),
    [themeFonts, colors],
  );
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Only on client-side
  }, []);
  return (
    <>
      {isClient ? (
        <Suspense fallback={<Loading />}>
          <FaroErrorBoundary>
            <MantineProvider theme={theme}>
              <Gen3Provider
                icons={icons}
                sessionConfig={sessionConfig}
                modalsConfig={modalsConfig}
              >
                <Component {...pageProps} />
              </Gen3Provider>
            </MantineProvider>
          </FaroErrorBoundary>
        </Suspense>
      ) : (
        // Show some fallback UI while waiting for the client to load
        <Loading />
      )}
    </>
  );
};


// TODO: replace with page router
Gen3App.getInitialProps = async (
  context: AppContext,
): Promise<Gen3AppProps & AppInitialProps> => {
  const ctx = await App.getInitialProps(context);

  try {
    const res = await loadContent();
    return {
      ...ctx,
      ...res,
    };
  } catch (error: any) {
    console.error('Provider Wrapper error loading config', error.toString());
  }
  // return default
  return {
    ...ctx,
    colors: {},
    themeFonts: {
      heading: ['Poppins', 'sans-serif'],
      content: ['Poppins', 'sans-serif'],
      fontFamily: 'Poppins',
    },
    icons: [
      {
        prefix: 'gen3',
        lastModified: 0,
        icons: {},
        width: 0,
        height: 0,
      },
    ],
    modalsConfig: {},
    sessionConfig: {},
  };
};
export default withFaroProfiler(Gen3App);
