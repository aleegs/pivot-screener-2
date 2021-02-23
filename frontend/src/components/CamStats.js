import React from "react";
import { Card, Statistic, Row, Col, Progress, Skeleton, Button } from "antd";
import { FallOutlined, RiseOutlined, ExclamationCircleOutlined, ColumnHeightOutlined } from "@ant-design/icons";
import { useMst } from "../models/Root";
import { observer } from "mobx-react-lite";
import { calcPercent } from "../utils/Helpers";

const CamStats = observer((props) => {
	const { tickers, toggleCamStatsPanel, camStatsPanelVisible, camStats } = useMst((store) => ({
		tickers: store.tickers,
		toggleCamStatsPanel: store.toggleCamStatsPanel,
		camStatsPanelVisible: store.camStatsPanelVisible,
		camStats: store.camStats,
	}));

	if (!tickers || (tickers.length === 0 && camStatsPanelVisible)) return <Skeleton />;

	const stats = camStats(props.timeframe);

	return (
		<>
			<Button style={{ marginBottom: 10 }} onClick={toggleCamStatsPanel}>
				{camStatsPanelVisible ? "Hide Statistics" : "Show Statistics"}
			</Button>

			<div>
				{camStatsPanelVisible ? (
					<>
						<div className="site-statistic-demo-card">
							<Row gutter={12}>
								<Col span={12}>
									<Card>
										<Statistic title="Above H4" value={stats.aboveH4} precision={0} valueStyle={{ color: "#3f8600" }} prefix={<RiseOutlined />} suffix="" />
									</Card>
								</Col>

								<Col span={12}>
									<Card>
										<Statistic title="Below L4" value={stats.belowL4} precision={0} valueStyle={{ color: "#cf1322" }} prefix={<FallOutlined />} suffix="" />
									</Card>
								</Col>
								<Col span={12}>
									<Card>
										<Statistic title="Above H3" value={stats.aboveH3} precision={0} valueStyle={{ color: "orange" }} prefix={<ExclamationCircleOutlined />} suffix="" />
									</Card>
								</Col>
								<Col span={12}>
									<Card>
										<Statistic title="Below L3" value={stats.belowL3} precision={0} valueStyle={{ color: "orange" }} prefix={<ExclamationCircleOutlined />} suffix="" />
									</Card>
								</Col>
								<Col span={24}>
									<Card>
										<Statistic title="Between L3 and H3" value={stats.betweenL3H3} precision={0} valueStyle={{ color: "gray" }} prefix={<ColumnHeightOutlined />} suffix="" />
									</Card>
								</Col>
							</Row>
						</div>

						<div style={{ paddingTop: 10 }}>
							{" "}
							🐂 <font color="green">Bulls {stats.bullsPercent.toFixed(1)}%</font> <b>vs</b> <font color="red">{stats.bearsPercent.toFixed(1)}% Bears</font> 🐻
							<Progress percent={100} success={{ percent: stats.bullsPercent }} showInfo={false} strokeColor="red" />
						</div>
					</>
				) : null}
			</div>
		</>
	);
});

export default CamStats;
