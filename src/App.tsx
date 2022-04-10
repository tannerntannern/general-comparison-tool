import { useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Button, Checkbox, Container, CssBaseline, FormControlLabel, Grid, IconButton, MenuItem, Paper, Rating, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GitHubIcon from '@mui/icons-material/GitHub';
import CheckIcon from '@mui/icons-material/Check';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { StrictMode } from 'react';
import { useLocalStorage } from 'react-use';

export default function App() {
    const [metricsTableOpen, setMetricsTableOpen] = useLocalStorage<boolean>('metricsTableOpen', true);
    const [comparables, setComparables] = useLocalStorage<Comparable[]>('comparables', [
        { name: 'Apartment 1' },
        { name: 'Apartment 2' },
    ]);
    const [comparableEditMode, setComparableEditMode] = useState<boolean[]>([
        false,
        false,
    ]);
    const [metrics, setMetrics] = useLocalStorage<Metric[]>('metrics', [
        { type: 'numeric', name: 'Rent', relativeImportance: 1, higherIsBetter: false },
        { type: 'numeric', name: 'Square Footage', relativeImportance: 1, higherIsBetter: true },
        { type: 'boolean', name: 'Has Parking', relativeImportance: 1, trueIsBetter: true },
    ]);
    const [metricData, setMetricData] = useLocalStorage<MetricRating[][]>('metricData', [
        [1400, 760, true],
        [1200, 700, false],
    ]);

    function addComparable() {
        setComparables([...comparables!, { name: `Item ${comparables!.length + 1}` }]);
        setComparableEditMode([...comparableEditMode, false]);
        setMetricData([
            ...metricData!,
            metrics!.map(metric => defaultMetricRating[metric.type]),
        ]);
    }

    function patchComparable(i: number, patch: Partial<Comparable>) {
        setComparables([
            ...comparables!.slice(0, i),
            { ...comparables![i], ...patch },
            ...comparables!.slice(i + 1),
        ]);
    }

    function swap<T>(data: T[], i: number, direction: 1 | -1): T[] {
        const clone = [...data];
        const temp = clone[i];
        clone[i] = clone[i + direction];
        clone[i + direction] = temp;
        return clone;
    }

    function moveComparable(i: number, direction: 1 | -1) {
        setComparables(swap(comparables!, i, direction));
        setComparableEditMode(swap(comparableEditMode, i, direction));
        setMetricData(swap(metricData!, i, direction));
    }

    function deleteComparable(i: number) {
        setComparables([...comparables!.slice(0, i), ...comparables!.slice(i + 1)]);
        setComparableEditMode([...comparableEditMode.slice(0, i), ...comparableEditMode.slice(1 + 1)]);
        setMetricData([...metricData!.slice(0, i), ...metricData!.slice(i + 1)]);
    }

    function patchComparableEditMode(i: number, newEditMode: boolean) {
        setComparableEditMode([...comparableEditMode.slice(0, i), newEditMode, ...comparableEditMode.slice(i + 1)]);
    }

    function addMetric() {
        const newMetric = defaultMetrics.numeric(metrics!);
        setMetrics([...metrics!, newMetric]);
        setMetricData(metricData!.map(row => [...row, defaultMetricRating[newMetric.type]]));
    }

    function patchMetric(i: number, patch: Partial<Metric>) {
        setMetrics([
            ...metrics!.slice(0, i),
            { ...metrics![i], ...patch } as any,
            ...metrics!.slice(i + 1),
        ])
    }

    function updateMetricType(i: number, metricType: Metric['type']) {
        patchMetric(i, {
            ...defaultMetrics[metricType](metrics!),
            name: metrics![i].name,
            relativeImportance: metrics![i].relativeImportance,
        });
        setMetricData(metricData!.map(row => [
            ...row.slice(0, i),
            defaultMetricRating[metricType],
            ...row.slice(i + 1),
        ]));
    }

    function moveMetric(i: number, direction: 1 | -1) {
        setMetrics(swap(metrics!, i, direction));
        setMetricData(metricData!.map(row => swap(row, i, direction)));
    }

    function deleteMetric(i: number) {
        setMetrics([...metrics!.slice(0, i), ...metrics!.slice(i + 1)]);
        setMetricData(metricData!.map(row => [...row.slice(0, i), ...row.slice(i + 1)]));
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
                        <Typography variant="h5">General-Purpose Comparison Tool</Typography>
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
                                        <Grid container spacing={1} flexDirection="column">
                                            <Grid item container alignItems="center">
                                                <Grid item>
                                                    {!comparableEditMode[i] ? (
                                                        <a href={comparable.url} target="_blank">
                                                            <Typography fontWeight="bold">
                                                                {comparable.name}
                                                            </Typography>
                                                        </a>
                                                    ) : (
                                                        <TextField
                                                            size="small"
                                                            label="Name"
                                                            value={comparable.name}
                                                            onChange={e => patchComparable(i, { name: e.target.value })}/>
                                                    )}
                                                </Grid>
                                                <Grid item>
                                                    <Tooltip title={comparableEditMode[i] ? 'Done editing' : 'Edit'}>
                                                        <IconButton size="small" onClick={() => patchComparableEditMode(i, !comparableEditMode[i])}>
                                                            {comparableEditMode[i] ? <CheckIcon/> : <EditIcon/>}
                                                        </IconButton>
                                                    </Tooltip>
                                                </Grid>
                                                {!comparableEditMode[i] && (<>
                                                    <Grid item>
                                                        <Tooltip title="Move left"><span>
                                                            <IconButton size="small" disabled={i === 0} onClick={() => moveComparable(i, -1)}>
                                                                <ArrowBackIcon/>
                                                            </IconButton>
                                                        </span></Tooltip>
                                                    </Grid>
                                                    <Grid item>
                                                        <Tooltip title="Move right"><span>
                                                            <IconButton size="small" disabled={i === comparables!.length - 1} onClick={() => moveComparable(i, 1)}>
                                                                <ArrowForwardIcon/>
                                                            </IconButton>
                                                        </span></Tooltip>
                                                    </Grid>
                                                    <Grid item>
                                                        <Tooltip title="Delete" onClick={() => deleteComparable(i)}>
                                                            <IconButton size="small">
                                                                <DeleteIcon/>
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Grid>
                                                </>)}
                                            </Grid>
                                            {comparableEditMode[i] && (
                                                <Grid item container spacing={1}>
                                                    <Grid item>
                                                        <TextField
                                                            size="small"
                                                            label="Image URL"
                                                            value={comparable.imageUrl ?? ''}
                                                            onChange={e => patchComparable(i, { imageUrl: e.target.value || undefined })}/>
                                                    </Grid>
                                                    <Grid item>
                                                        <TextField
                                                            size="small"
                                                            label="More info URL"
                                                            value={comparable.url ?? ''}
                                                            onChange={e => patchComparable(i, { url: e.target.value || undefined })}/>
                                                    </Grid>
                                                </Grid>
                                            )}
                                            {!comparableEditMode[i] && comparable.imageUrl && (
                                                <Grid item>
                                                    <a href={comparable.url} target="_blank">
                                                        <img src={comparable.imageUrl} width="200px"/>
                                                    </a>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <Button onClick={addComparable}>
                                        New column
                                    </Button>
                                </TableCell>
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
                <Accordion expanded={metricsTableOpen} onChange={(_, newState) => setMetricsTableOpen(newState)}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography>Metric Definitions ({metrics!.length})</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
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
                                    {metrics!.map((metric, i) => (
                                        <TableRow key={i}>
                                            <TableCell style={{ minWidth: '12em' }}>
                                                <TextField
                                                    size="small"
                                                    value={metric.name}
                                                    onChange={e => patchMetric(i, { name: e.target.value })}/>
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
                                                    onChange={e => patchMetric(i, { relativeImportance: parseFloat(e.target.value) })}
                                                    InputProps={{ type: 'number' }}/>
                                            </TableCell>
                                            <TableCell>
                                                {metric.type === 'boolean' ? (
                                                    <FormControlLabel label="True is better" control={
                                                        <Checkbox checked={metric.trueIsBetter} onChange={e => patchMetric(i, { trueIsBetter: e.target.checked })}/>
                                                    }/>
                                                ) : metric.type === 'numeric' ? (
                                                    <FormControlLabel label="Higher is better" control={
                                                        <Checkbox checked={metric.higherIsBetter} onChange={e => patchMetric(i, { higherIsBetter: e.target.checked })}/>
                                                    }/>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="Delete">
                                                    <IconButton onClick={() => deleteMetric(i)}>
                                                        <DeleteIcon/>
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Move up"><span>
                                                    <IconButton disabled={i === 0} onClick={() => moveMetric(i, -1)}>
                                                        <ArrowUpwardIcon/>
                                                    </IconButton>
                                                </span></Tooltip>
                                                <Tooltip title="Move down"><span>
                                                    <IconButton disabled={i === metrics!.length - 1} onClick={() => moveMetric(i, 1)}>
                                                        <ArrowDownwardIcon/>
                                                    </IconButton>
                                                </span></Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Button style={{ marginTop: '1em' }} onClick={addMetric}>
                            New Metric
                        </Button>
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
    
    if (props.type === 'five-star')
        return (
            <Rating
                size="small"
                value={props.value as number}
                onChange={(_, newValue) => props.onChange(newValue as number)}/>
        );
    
    return (
        <TextField
            size="small"
            value={props.value}
            onChange={e => props.onChange(parseFloat(e.target.value))}
            InputProps={{ type: 'number' }}/>
    );
}

const typeLabels: { [T in Metric['type']]: string } = {
    'boolean': 'Boolean',
    'five-star': '5 Star',
    'numeric': 'Numeric',
};

const defaultMetricRating: { [T in Metric['type']]: MetricRating<T> } = {
    'boolean': false,
    'five-star': 1,
    'numeric': 0,
};

const defaultMetrics: { [T in Metric['type']]: (existingMetrics: Metric[]) => Metric } = {
    'boolean': existingMetrics => ({
        type: 'boolean',
        trueIsBetter: true,
        name: `Boolean${existingMetrics.filter(m => m.type === 'boolean').length + 1}`,
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
    : T extends 'five-star' ? (1 | 2 | 3 | 4 | 5)
    : T extends 'numeric' ? number
    : never;

type Metric = BooleanMetric | FiveStarMetric | NumericMetric;

interface BooleanMetric extends AbstractMetric {
    type: 'boolean',
    trueIsBetter: boolean,
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
