import { VehicleState } from './types';
import vehiclesData from '../../data/vehicles.json';
import pricingData from '../../data/pricing.json';

export function createInitialVehicle(): VehicleState {
  const defaultModel = vehiclesData.find((v) => v.id === 'wave_alpha') || vehiclesData[0];
  return {
    id: defaultModel.id,
    name: defaultModel.name,
    fuelType: 'gas',
    fuelCurrent: 3.0, // ~80% full
    fuelCapacity: defaultModel.fuelCapacityLiters || 3.7,
    odometerKm: 14200,
    condition: {
      tires: 85,
      oil: 70,
      brakes: 90,
      chain: 80,
    },
  };
}

export function refuelVehicle(
  vehicle: VehicleState,
  cashAvailable: number,
  litersRequested?: number
): { vehicle: VehicleState; cost: number; litersAdded: number; error?: string } {
  const maxCanAdd = vehicle.fuelCapacity - vehicle.fuelCurrent;
  if (maxCanAdd <= 0.1) {
    return { vehicle, cost: 0, litersAdded: 0, error: 'Bình xăng đã gần đầy!' };
  }

  const targetLiters = litersRequested ? Math.min(litersRequested, maxCanAdd) : maxCanAdd;
  const gasPrice = pricingData.gasPricePerLiter;
  const cost = Math.round(targetLiters * gasPrice);

  if (cashAvailable < cost) {
    // If not enough cash, buy as much as possible with cash
    const affordableLiters = Math.max(0, cashAvailable / gasPrice);
    if (affordableLiters < 0.5) {
      return { vehicle, cost: 0, litersAdded: 0, error: 'Không đủ tiền mặt để đổ xăng!' };
    }
    const actualCost = Math.round(affordableLiters * gasPrice);
    return {
      vehicle: {
        ...vehicle,
        fuelCurrent: vehicle.fuelCurrent + affordableLiters,
      },
      cost: actualCost,
      litersAdded: affordableLiters,
    };
  }

  return {
    vehicle: {
      ...vehicle,
      fuelCurrent: vehicle.fuelCurrent + targetLiters,
    },
    cost,
    litersAdded: targetLiters,
  };
}

