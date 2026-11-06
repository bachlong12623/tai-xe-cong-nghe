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
      oil: 75,
      brakes: 90,
      chain: 80,
      sparkPlug: 85,
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

/**
 * Degrade 5 vehicle parts by km traveled.
 */
export function degradeVehicleParts(vehicle: VehicleState, kmDriven: number): VehicleState {
  if (kmDriven <= 0) return vehicle;

  const cond = { ...vehicle.condition };

  // Tires: ~8000 km lifespan
  cond.tires = Math.max(0, cond.tires - (kmDriven / 8000) * 100);
  // Oil: ~1500 km lifespan
  cond.oil = Math.max(0, cond.oil - (kmDriven / 1500) * 100);
  // Brakes: ~10000 km lifespan
  cond.brakes = Math.max(0, cond.brakes - (kmDriven / 10000) * 100);
  // Chain: ~15000 km lifespan
  cond.chain = Math.max(0, cond.chain - (kmDriven / 15000) * 100);
  // Spark plug: ~8000 km lifespan
  cond.sparkPlug = Math.max(0, cond.sparkPlug - (kmDriven / 8000) * 100);

  return {
    ...vehicle,
    condition: cond,
  };
}

export const REPAIR_PARTS_INFO: Record<
  keyof VehicleState['condition'],
  { name: string; price: number; description: string }
> = {
  tires: { name: 'Thay cặp vỏ/lốp xe', price: 250000, description: 'Lốp bám đường tốt, giảm trơn trượt khi mưa và chống thủng đinh' },
  oil: { name: 'Thay nhớt máy', price: 120000, description: 'Động cơ êm ái, bốc hơn và tiết kiệm xăng' },
  brakes: { name: 'Thay bố thắng/phanh', price: 100000, description: 'Khoảng cách phanh an toàn, phòng chống tai nạn' },
  chain: { name: 'Tăng sên / Thay nhông sên dĩa', price: 180000, description: 'Xe không bị giật cục hay tuột xích giữa đường' },
  sparkPlug: { name: 'Thay bugi đánh lửa', price: 70000, description: 'Bugi mới giúp xe dễ nổ và không chết máy khi lội ngập' },
};

export function repairVehiclePart(
  vehicle: VehicleState,
  part: keyof VehicleState['condition'],
  cashAvailable: number
): { vehicle: VehicleState; cost: number; error?: string } {
  const info = REPAIR_PARTS_INFO[part];
  if (!info) return { vehicle, cost: 0, error: 'Bộ phận không hợp lệ!' };

  if (cashAvailable < info.price) {
    return { vehicle, cost: 0, error: `Không đủ tiền mặt để ${info.name.toLowerCase()} (Cần ${info.price.toLocaleString('vi-VN')}đ)!` };
  }

  const cond = { ...vehicle.condition, [part]: 100 };
  return {
    vehicle: {
      ...vehicle,
      condition: cond,
    },
    cost: info.price,
  };
}
