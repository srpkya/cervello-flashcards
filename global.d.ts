// global.d.ts
import { NextPage } from 'next'
import { AppProps } from 'next/app'
import { ReactElement, ReactNode } from 'react'

declare global {
  type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
    getLayout?: (page: ReactElement) => ReactNode
  }

  type AppPropsWithLayout = AppProps & {
    Component: NextPageWithLayout
  }
}

export {}