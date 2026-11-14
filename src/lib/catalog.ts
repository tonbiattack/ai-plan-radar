import raw from '../data/catalog.json';
import { catalogSchema } from './schema';

export const catalog = catalogSchema.parse(raw);
