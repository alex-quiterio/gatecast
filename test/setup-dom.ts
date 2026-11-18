import { GlobalRegistrator } from '@happy-dom/global-registrator';

// A DOM for component tests. Pure-logic tests do not care that it exists.
GlobalRegistrator.register({ url: 'http://localhost:3000/' });
