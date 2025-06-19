import { Logger, MonoContext, MonoContextState } from '@repo/core-modules';
import { initDataSources, GenericApi  } from '.';
import { Mongoose } from 'mongoose';

interface ApiDataSources {
  mongoose: Mongoose;
  httpbin: GenericApi;
}

interface DataSourcesContext extends MonoContextState {
  dataSources: ApiDataSources;
}

const logger = new Logger({ optionsByLevel: "debug",  });

MonoContext.setState({
  logger,
});

describe('Data Sources', () => {
  it('can provide an API data source', async () => {
    await initDataSources({
      api: [
        {
          apiBaseUrl: 'https://httpbin.org',
          apiName: 'httpbin',
        },
      ],
    });

    const { dataSources } = MonoContext.getState<DataSourcesContext>();
    const { httpbin } = dataSources;

    expect(httpbin).toBeDefined();

    const { result } = await httpbin.request(
      {
        method: 'GET',
        url: '/get',
      }
    );

    logger.debug(result);

    expect(result).toBeDefined();
    expect(result.url).toBe('https://httpbin.org/get');
  });

  it('can provide a MongoDB data source', async () => {
    jest.setTimeout(30000);

    await initDataSources({
      mongodb: {},
    });

    const { dataSources } = MonoContext.getState<DataSourcesContext>();
    const { mongodb } = dataSources;

    expect(mongodb).toBeDefined();

    const db = await mongodb.db('admin');
    const result = await db.stats();

    logger.debug(result);

    expect(result).toBeDefined();
    expect(result.ok).toBe(1);
  });

  it('can provide a Mongooose data source', async () => {
    jest.setTimeout(30000);

    await initDataSources({
      mongoose: {},
    });

    const { dataSources } = MonoContext.getState<DataSourcesContext>();
    const { mongoose } = dataSources;
    const connection = mongoose.connection;

    expect(connection).toBeDefined();

    const result = await connection.db.stats();

    logger.debug(result);

    expect(result).toBeDefined();
    expect(result.ok).toBe(1);
  });

  afterAll(() => {
    const { dataSources } = MonoContext.getState<DataSourcesContext>() ;
    const {  mongoose } = dataSources;
    mongoose.connection.close();
  });
});