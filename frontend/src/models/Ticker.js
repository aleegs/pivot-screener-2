import { types } from "mobx-state-tree";
import { inRange, percentDifference } from "../utils/Helpers";

// TODO: Optimize views use cache or something

export const Ticker = types
	.model({
		symbol: types.string,
		market: types.string,
		exchange: types.string,
		candlesticks: types.optional(types.frozen()),
	})
	.actions((self) => ({
		setSymbol(newSymbol) {
			self.symbol = newSymbol;
		},
	}))
	.views((self) => {
		return {
			get price() {
				const session = self.getCurrentSessionOHLC();
				return !session ? 0 : session.close;
			},
			getTimeframeCandlesticks(timeframe = "any") {
				if (!self.candlesticks || (timeframe !== "any" && !Object.keys(self.candlesticks).includes(timeframe + "Candles"))) return undefined;
				const candles = timeframe === "any" ? self.candlesticks[Object.keys(self.candlesticks)[0]] : self.candlesticks[timeframe + "Candles"];
				return candles;
			},
			getPreviousSessionOHLC(timeframe = "any") {
				const candles = self.getTimeframeCandlesticks(timeframe);
				if (!candles) return undefined;
				return candles.length < 2 ? undefined : candles[candles.length - 2];
			},
			getCurrentSessionOHLC(timeframe = "any") {
				const candles = self.getTimeframeCandlesticks(timeframe);
				if (!candles) return undefined;
				return candles.length < 1 ? undefined : candles[candles.length - 1];
			},
			getCPR(timeframe, future = false) {
				let result = {
					p: undefined,
					bc: undefined,
					tc: undefined,
					width: undefined,
					isTested: undefined,
					price_position: undefined,
					distance: { p: undefined, tc: undefined, bc: undefined },
					closestApproximation: undefined,
				};
				const currSession = self.getCurrentSessionOHLC(timeframe);
				const session = future ? currSession : self.getPreviousSessionOHLC(timeframe);

				if (!session) return result;

				result.p = (session.high + session.low + session.close) / 3.0;
				result.bc = (session.high + session.low) / 2.0;
				result.tc = result.p - result.bc + result.p;

				if (result.bc > result.tc) {
					result.bc = [result.tc, (result.tc = result.bc)][0];
				}
				const width_result = ((Math.abs(result.tc - result.bc) / result.p) * 100).toFixed(2);
				result.width = width_result;

				result.isTested = future ? false : inRange(result.bc, currSession.low, currSession.high) || inRange(result.tc, currSession.low, currSession.high);
				result.price_position = currSession.close >= result.tc ? "above" : currSession.close <= result.bc ? "below" : "neutral";
				result.distance.p = percentDifference(currSession.close, result.p);
				result.distance.bc = percentDifference(currSession.close, result.bc);
				result.distance.tc = percentDifference(currSession.close, result.tc);

				result.closestApproximation = future ? 0 : result.price_position === "above" ? percentDifference(currSession.low, result.tc) : percentDifference(currSession.high, result.bc);

				return result;
			},
			getCamarilla(timeframe, future = false) {
				let result = {
					h3: undefined,
					h4: undefined,
					h5: undefined,
					h6: undefined,
					l3: undefined,
					l4: undefined,
					l5: undefined,
					l6: undefined,
					situation: undefined,
					distance: { h3: undefined, h4: undefined, h5: undefined, h6: undefined, l3: undefined, l4: undefined, l5: undefined, l6: undefined },
					nearest: undefined,
				};
				const currSession = self.getCurrentSessionOHLC(timeframe);
				const session = future ? currSession : self.getPreviousSessionOHLC(timeframe);

				if (!session) return result;

				const range = session.high - session.low;
				result.h4 = session.close + (range * 1.1) / 2;
				result.h3 = session.close + (range * 1.1) / 4;
				result.l3 = session.close - (range * 1.1) / 4;
				result.l4 = session.close - (range * 1.1) / 2;
				result.h6 = (session.high / session.low) * session.close;
				result.h5 = result.h4 + 1.168 * (result.h4 - result.h3);
				result.l5 = result.l4 - 1.168 * (result.l3 - result.l4);
				result.l6 = session.close - (result.h6 - session.close);

				// For each Camarilla level add result.level_priceStatus "above" if the current PRICE is above this level, "below" if it's below
				Object.keys(result).forEach((k) => {
					result[k + "_priceStatus"] = self.price > result[k] ? "above" : "below";
				});

				result.situation =
					(result.h4_priceStatus === "above" && "Above H4") ||
					(result.h3_priceStatus === "above" && result.h4_priceStatus !== "above" && "Above H3") ||
					(result.l3_priceStatus === "below" && result.l4_priceStatus !== "below" && "Below L3") ||
					(result.l4_priceStatus === "below" && "Below L4") ||
					(result.h3_priceStatus === "below" && result.l3_priceStatus === "above" && "Between H3-L3");

				// Calculate distance percentage for every level in result.distance
				Object.keys(result.distance).forEach((k) => {
					result.distance[k] = percentDifference(currSession.close, result[k]);
				});

				// Get nearest level
				result.nearest = Object.keys(result.distance)
					.map(function (k) {
						// Convert to [key, value]
						return [k, result.distance[k]];
					})
					.reduce(function (a, b) {
						// Get the minimum pair
						return b[1] < a[1] ? b : a;
					})[0]; // Result will be [key, value], we just need the key

				return result;
			},
		};
	});
