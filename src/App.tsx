import { useState, useEffect } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Button, Checkbox, Container, CssBaseline, FormControlLabel, Grid, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GitHubIcon from '@mui/icons-material/GitHub';
import { StrictMode } from 'react';
import { useLocalStorage } from 'react-use';

export default function App() {
    const [metricsTableOpen, setMetricsTableOpen] = useLocalStorage<boolean>('metricsTableOpen', true);
    const [comparables, setComparables] = useLocalStorage<Comparable[]>('comparables', [
        { name: 'Apartment 1' },
        { name: 'Apartment 2' },
    ]);
    const [metrics, _setMetrics] = useLocalStorage<Metric[]>('metrics', [
        { type: 'numeric', name: 'Rent', relativeImportance: 1, higherIsBetter: false },
        { type: 'numeric', name: 'Square Footage', relativeImportance: 1, higherIsBetter: true },
        { type: 'boolean', name: 'Has Parking', relativeImportance: 1, trueIsBetter: true },
    ]);
    const [lastMetrics, setLastMetrics] = useState(metrics!);
    const [metricData, setMetricData] = useLocalStorage<MetricRating[][]>('metricData', [
        [1400, 760, true],
        [1200, 700, false],
    ]);

    function setMetrics(newMetrics: Metric[]) {
        setLastMetrics(metrics!);
        _setMetrics(newMetrics);
    }

    // TODO: need useEffect to fix metricData when metrics change

    function updateComparable(i: number, newComparable: Comparable) {
        setComparables([
            ...comparables!.slice(0, i),
            newComparable,
            ...comparables!.slice(i + 1),
        ]);
    }

    function updateMetricData(comparableIndex: number, metricIndex: number, value: MetricRating) {
        setMetricData([
            ...metricData!.slice(0, comparableIndex),
            [
                ...metricData![comparableIndex].slice(0, metricIndex),
                value,
                ...metricData![comparableIndex].slice(metricIndex + 1),
            ],
            ...metricData!.slice(comparableIndex + 1),
        ]);
    }

    return (
        <AppProviders>
            <Container style={{ marginTop: '1em', marginBottom: '1em' }}>
                <Grid container>
                    <Grid item flexGrow={1}>
                        <Typography variant="h5">General-Purpose Comparison Tool (work in progress)</Typography>
                    </Grid>
                    <Grid item>
                        <a href="https://github.com/tannerntannern/general-comparison-tool" target="_blank"><GitHubIcon/></a>
                    </Grid>
                </Grid>
                <TableContainer component={Paper} sx={{ marginY: '1em' }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell></TableCell>
                                {comparables!.map((comparable, i) => (
                                    <TableCell key={i}>
                                        {comparable.name}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {metrics!.map((metric, metricIndex) => (
                                <TableRow key={metricIndex}>
                                    <TableCell align="right">
                                        <Typography fontWeight={500}>{metric.name}</Typography>
                                    </TableCell>
                                    {comparables!.map((_, comparableIndex) => (
                                        <TableCell key={comparableIndex}>
                                            <MetricRating
                                                type={metric.type}
                                                value={metricData![comparableIndex][metricIndex]}
                                                onChange={newValue => updateMetricData(comparableIndex, metricIndex, newValue)}/>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <Accordion expanded={metricsTableOpen} onChange={(event, newState) => setMetricsTableOpen(newState)}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography>Metric Definitions ({metrics!.length})</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <MetricsTable metrics={metrics!} setMetrics={setMetrics}/>
                    </AccordionDetails>
                </Accordion>
            </Container>
        </AppProviders>
    );
}

function MetricRating(props: { type: Metric['type'], value: MetricRating, onChange: (newValue: MetricRating) => void }) {
    if (props.type === 'boolean')
        return (
            <Checkbox checked={props.value as boolean} onChange={e => props.onChange(e.target.checked)}/>
        );

    if (props.type === 'bad-neutral-good')
        return (
            <span>TODO</span>
        );
    
    if (props.type === 'five-star')
        return (
            <span>TODO</span>
        );
    
    return (
        <TextField
            size="small"
            value={props.value}
            onChange={e => props.onChange(parseFloat(e.target.value))}
            InputProps={{ type: 'number' }}/>
    );
}

function MetricsTable(props: { metrics: Metric[], setMetrics: (newMetrics: Metric[]) => void }) {
    function updateMetric(i: number, newMetric: Metric) {
        props.setMetrics([
            ...props.metrics.slice(0, i),
            newMetric,
            ...props.metrics.slice(i + 1),
        ])
    }

    function updateMetricType(i: number, metricType: Metric['type']) {
        updateMetric(i, {
            ...defaultMetrics[metricType](props.metrics),
            name: props.metrics[i].name,
            relativeImportance: props.metrics[i].relativeImportance,
        });
    }

    function deleteMetric(i: number) {
        props.setMetrics([...props.metrics.slice(0, i), ...props.metrics.slice(i + 1)]);
    }

    return (<>
        <TableContainer>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell>Metric Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Relative Importance</TableCell>
                        <TableCell>Interpretation</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {props.metrics.map((metric, i) => (
                        <TableRow key={i}>
                            <TableCell style={{ minWidth: '12em' }}>
                                <TextField
                                    size="small"
                                    value={metric.name}
                                    onChange={e => updateMetric(i, { ...metric, name: e.target.value })}/>
                            </TableCell>
                            <TableCell>
                                <TextField
                                    size="small"
                                    select
                                    value={metric.type}
                                    onChange={e => updateMetricType(i, e.target.value as any)}>
                                    {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map(key => (
                                        <MenuItem key={key} value={key}>{typeLabels[key]}</MenuItem>
                                    ))}
                                </TextField>
                            </TableCell>
                            <TableCell>
                                <TextField
                                    size="small"
                                    value={metric.relativeImportance}
                                    onChange={e => updateMetric(i, { ...metric, relativeImportance: parseFloat(e.target.value) })}
                                    InputProps={{ type: 'number' }}/>
                            </TableCell>
                            <TableCell>
                                {metric.type === 'boolean' ? (
                                    <FormControlLabel label="True is better" control={
                                        <Checkbox checked={metric.trueIsBetter} onChange={e => updateMetric(i, { ...metric, trueIsBetter: e.target.checked })}/>
                                    }/>
                                ) : metric.type === 'numeric' ? (
                                    <FormControlLabel label="Higher is better" control={
                                        <Checkbox checked={metric.higherIsBetter} onChange={e => updateMetric(i, { ...metric, higherIsBetter: e.target.checked })}/>
                                    }/>
                                ) : (
                                    'N/A'
                                )}
                            </TableCell>
                            <TableCell>
                                <Button color="error" onClick={() => deleteMetric(i)}>
                                    Delete
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
        <Button style={{ marginTop: '1em' }} onClick={() => props.setMetrics([...props.metrics, defaultMetrics.numeric(props.metrics)])}>
            New Metric
        </Button>
    </>);
}

const typeLabels: { [T in Metric['type']]: string } = {
    'boolean': 'Boolean',
    'bad-neutral-good': 'Bad/Neutral/Good',
    'five-star': '5 Star',
    'numeric': 'Numeric',
};

const defaultMetricRating: { [T in Metric['type']]: MetricRating<T> } = {
    'boolean': false,
    'bad-neutral-good': 'neutral',
    'five-star': 0,
    'numeric': 0,
};

const defaultMetrics: { [T in Metric['type']]: (existingMetrics: Metric[]) => Metric } = {
    'boolean': existingMetrics => ({
        type: 'boolean',
        trueIsBetter: true,
        name: `Boolean${existingMetrics.filter(m => m.type === 'boolean').length + 1}`,
        relativeImportance: 1,
    }),
    'bad-neutral-good': existingMetrics => ({
        type: 'bad-neutral-good',
        name: `BadNeutralGood${existingMetrics.filter(m => m.type === 'bad-neutral-good').length + 1}`,
        relativeImportance: 1,
    }),
    'five-star': existingMetrics => ({
        type: 'five-star',
        name: `FiveStar${existingMetrics.filter(m => m.type === 'five-star').length + 1}`,
        relativeImportance: 1,
    }),
    'numeric': existingMetrics => ({
        type: 'numeric',
        name: `Numeric${existingMetrics.filter(m => m.type === 'numeric').length + 1}`,
        higherIsBetter: true,
        relativeImportance: 1,
    }),
};

interface Comparable {
    name: string,
    url?: string,
    imageUrl?: string,
}

type MetricRating<T extends Metric['type'] = Metric['type']>
    = T extends 'boolean' ? boolean
    : T extends 'bad-neutral-good' ? ('bad' | 'neutral' | 'good')
    : T extends 'five-star' ? (0 | 1 | 2 | 3 | 4 | 5)
    : T extends 'numeric' ? number
    : never;

type Metric = BooleanMetric | BadNeutralGoodMetric | FiveStarMetric | NumericMetric;

interface BooleanMetric extends AbstractMetric {
    type: 'boolean',
    trueIsBetter: boolean,
}

interface BadNeutralGoodMetric extends AbstractMetric {
    type: 'bad-neutral-good',
}

interface FiveStarMetric extends AbstractMetric {
    type: 'five-star'
}

interface NumericMetric extends AbstractMetric {
    type: 'numeric',
    higherIsBetter: boolean,
}

interface AbstractMetric {
    name: string,
    relativeImportance: number,
}

function AppProviders(props: { children: JSX.Element }) {
    return (
        <StrictMode>
            <CssBaseline/>
            {props.children}
        </StrictMode>
    );
}
