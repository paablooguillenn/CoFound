import { Router } from 'express';

import { getDiscoveryController, getLocationsController } from '../controllers/discovery.controller';

export const discoveryRouter = Router();

discoveryRouter.get('/', getDiscoveryController);
discoveryRouter.get('/locations', getLocationsController);
