import { VehicleState } from './types';
import vehiclesData from '../../data/vehicles.json';
import pricingData from '../../data/pricing.json';

export function createVehicle(vehicleId: string): VehicleState {
  const model = vehiclesData.find((v) => v.id === vehicleId) || vehiclesData[0];
  const isElectric = model.fuelType === 'electric';
  const isCar = model.category === 'car';

  return {
    id: model.id,
    name: model.name,
    category: isCar ? 'car' : isElectric ? 'motorcycle_electric' : 'motorcycle',
    fuelType: isElectric ? 'electric' : 'gas',
    fuelCurrent: isElectric ? 90 : 3.0, // 90% or 3.0L
    fuelCapacity: isElectric ? 100 : (model.fuelCapacityLiters || 3.7),
    odometerKm: isCar ? 45000 : 14200,
    condition: {
      tires: 85,
      oil: 75,
      brakes: 90,
      chain: 80,
      sparkPlug: 85,
    },
    canDeliverFood: model.canDeliverFood ?? true,
    canRidePassenger: model.canRidePassenger ?? true,
  };
}

export function createInitialVehicle(): VehicleState {
  return createVehicle('wave_alpha');
}

export function refuelVehicle(
  vehicle: VehicleState,
  cashAvailable: number,
  litersRequested?: number
): { vehicle: VehicleState; cost: number; litersAdded: number; error?: string } {
  if (vehicle.fuelType === 'electric') {
    return { vehicle, cost: 0, litersAdded: 0, error: 'Xe điện không dùng xăng! Hãy chọn Đổi pin hoặc Sạc điện.' };
  }

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

export function swapBattery(
  vehicle: VehicleState,
  cashAvailable: number
): { vehicle: VehicleState; cost: number; error?: string } {
  if (vehicle.fuelType !== 'electric') {
    return { vehicle, cost: 0, error: 'Chỉ xe máy điện mới có thể đổi pin!' };
  }

  const swapCost = 15000;
  if (cashAvailable < swapCost) {
    return { vehicle, cost: 0, error: `Không đủ tiền đổi pin (cần ${swapCost.toLocaleString('vi-VN')}đ)!` };
  }

  if (vehicle.fuelCurrent >= 95) {
    return { vehicle, cost: 0, error: 'Pin xe vẫn còn đầy (trên 95%), chưa cần đổi!' };
  }

  return {
    vehicle: {
      ...vehicle,
      fuelCurrent: 100,
    },
    cost: swapCost,
  };
}

export function chargeBattery(
  vehicle: VehicleState,
  minutes: number
): VehicleState {
  if (vehicle.fuelType !== 'electric') return vehicle;
  // ~25% per 60 minutes
  const chargePercent = (minutes / 60) * 25;
  return {
    ...vehicle,
    fuelCurrent: Math.min(100, vehicle.fuelCurrent + chargePercent),
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
  // Oil: ~1500 km lifespan (for electric, motor cooling oil lasts longer: ~5000km)
  const oilLifespan = vehicle.fuelType === 'electric' ? 5000 : 1500;
  cond.oil = Math.max(0, cond.oil - (kmDriven / oilLifespan) * 100);
  // Brakes: ~10000 km lifespan
  cond.brakes = Math.max(0, cond.brakes - (kmDriven / 10000) * 100);
  // Chain: ~15000 km lifespan
  cond.chain = Math.max(0, cond.chain - (kmDriven / 15000) * 100);
  // Spark plug: ~8000 km lifespan (electric motor does not wear spark plugs as quickly, or inverter circuit)
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
