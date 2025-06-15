import { DataSource, DataSourceOptions } from 'typeorm';

import { typeormConfig } from './config/typeorm';

const dataSourceOptions = typeormConfig as DataSourceOptions;

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
