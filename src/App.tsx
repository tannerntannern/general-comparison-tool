import { memo, useCallback, useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, CardMedia, Checkbox, Container, CssBaseline, FormControlLabel, Grid, IconButton, MenuItem, Paper, Rating, SxProps, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography } from '@mui/material';
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

const tabs = ["Metric Definitions", "Data Entry", "Results View"] as const;

export default function App() {
    const [selectedTab, setSelectedTab] = useLocalStorage('tabState', tabs[0] as typeof tabs[number]);

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

    const results = useMemo<[Comparable, number][]>(() => {
        const scores = metricData!
            .map(column => {
                return metrics!
                    .map((metric, i) => {
                        const rating = column[i];
                        if (metric.type === 'boolean')
                            return metric.relativeImportance * (!!rating === metric.trueIsBetter ? 1 : 0);
                        if (metric.type === 'five-star')
                            return metric.relativeImportance * ((rating as number) / 5);
                        if (metric.type === 'numeric') {
                            const row = metricData!.map(column => column[i] as number);
                            const best = metric.higherIsBetter ? Math.max(...row) : Math.min(...row);

                            // TODO: divide by zero errors
                            const unweightedScore = metric.higherIsBetter ? (rating as number / best) : (best / (rating as number));

                            return metric.relativeImportance * unweightedScore;
                        }
                        
                        // @ts-ignore: all cases are covered currently, but might not be if new metric type is added
                        throw new Error(`Unsupported metric type "${metric.type}"`);
                    })
                    .reduce((a, b) => a + b, 0) / metrics!.length;
            });
        
        return scores
            .map((score, i) => [comparables![i], score] as [Comparable, number])
            .sort((a, b) => b[1] - a[1]);
    }, [comparables, metrics, metricData]);

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
        setMetricData(metricData!.map(column => [...column, defaultMetricRating[newMetric.type]]));
    }

    const patchMetric = useCallback((i: number, patch: Partial<Metric>) => {
        setMetrics([
            ...metrics!.slice(0, i),
            { ...metrics![i], ...patch } as any,
            ...metrics!.slice(i + 1),
        ])
    }, [metrics]);

    const updateMetricType = useCallback((i: number, metricType: Metric['type']) => {
        patchMetric(i, {
            ...defaultMetrics[metricType](metrics!),
            name: metrics![i].name,
            relativeImportance: metrics![i].relativeImportance,
        });
        setMetricData(metricData!.map(column => [
            ...column.slice(0, i),
            defaultMetricRating[metricType],
            ...column.slice(i + 1),
        ]));
    }, [metrics, metricData]);

    const moveMetric = useCallback((i: number, direction: 1 | -1) => {
        setMetrics(swap(metrics!, i, direction));
        setMetricData(metricData!.map(column => swap(column, i, direction)));
    }, [metrics, metricData]);

    const deleteMetric = useCallback((i: number) => {
        setMetrics([...metrics!.slice(0, i), ...metrics!.slice(i + 1)]);
        setMetricData(metricData!.map(column => [...column.slice(0, i), ...column.slice(i + 1)]));
    }, [metrics, metricData]);

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
            <Container sx={appContainerSx}>
                <Grid container>
                    <Grid item flexGrow={1}>
                        <Typography variant="h5">General-Purpose Comparison Tool</Typography>
                    </Grid>
                    <Grid item>
                        <a href="https://github.com/tannerntannern/general-comparison-tool" target="_blank"><GitHubIcon/></a>
                    </Grid>
                </Grid>
                <Box sx={tabsContainerSx}>
                    <Tabs value={selectedTab} onChange={(ev, val) => setSelectedTab(val!)} scrollButtons="auto" variant="scrollable">
                        {tabs.map(tab => (
                            <Tab key={tab} label={tab} value={tab}/>
                        ))}
                    </Tabs>
                </Box>
                {selectedTab === 'Metric Definitions' && (<>
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
                                    <MetricDefinitionRow
                                        key={i}
                                        index={i}
                                        totalMetrics={metrics!.length}
                                        metric={metric}
                                        patch={patchMetric}
                                        changeType={updateMetricType}
                                        move={moveMetric}
                                        delete={deleteMetric}/>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Button style={{ marginTop: '1em' }} onClick={addMetric}>
                        New Metric
                    </Button>
                </>)}
                {selectedTab === 'Data Entry' && (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {comparables!.map((comparable, i) => (
                                        <TableCell key={i}>
                                            <Grid container spacing={1} flexDirection="column">
                                                <Grid item container alignItems="center" wrap="nowrap" xs={12}>
                                                    {!comparableEditMode[i] ? (
                                                        <a href={comparable.url} target="_blank">
                                                            <Typography fontWeight="bold">
                                                                {comparable.name}
                                                            </Typography>
                                                        </a>
                                                    ) : (<>
                                                        <Grid item>
                                                            <TextField
                                                                size="small"
                                                                label="Name"
                                                                value={comparable.name}
                                                                onChange={e => patchComparable(i, { name: e.target.value })}/>
                                                        </Grid>
                                                        <Grid item>
                                                            <Tooltip title="Edit">
                                                                <IconButton size="small" onClick={() => patchComparableEditMode(i, false)}>
                                                                    <CheckIcon/>
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Grid>
                                                    </>)}
                                                </Grid>
                                                {!comparableEditMode[i] && (
                                                    <Grid item container alignItems="center" wrap="nowrap" xs={12}>
                                                        <Grid item>
                                                            <Tooltip title="Done editing">
                                                                <IconButton size="small" onClick={() => patchComparableEditMode(i, true)}>
                                                                    <EditIcon/>
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Grid>
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
                                                    </Grid>
                                                )}
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
                                                            <img src={comparable.imageUrl} height="150px"/>
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
                                        {comparables!.map((_, comparableIndex) => (
                                            <TableCell key={comparableIndex}>
                                                <MetricRating
                                                    label={metric.name}
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
                )}
                {selectedTab === 'Results View' && (
                    <Grid container spacing={2}>
                        {results.map(([comparable, score], i) => (
                            <Grid item key={i} xs={12} md={6} lg={4} xl={3}>
                                <Card>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={comparable.imageUrl}/>
                                    <CardContent sx={{ flex: '1 0 auto' }}>
                                        <Typography component="div" variant="h4">
                                            #{i + 1} {comparable.name}
                                        </Typography>
                                        <Typography variant="subtitle1" color="text.secondary" component="div">
                                            Overall Score: {Math.round(score * 1000)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
        </AppProviders>
    );
}

const MetricDefinitionRow = memo(function MetricDefintionRow(props: {
    index: number,
    totalMetrics: number,
    metric: Metric,
    patch: (i: number, patch: Partial<Metric>) => void,
    changeType: (i: number, newType: Metric['type']) => void,
    move: (i: number, direction: -1 | 1) => void,
    delete: (i: number) => void,
}) {
    return (
        <TableRow>
            <TableCell style={{ minWidth: '12em' }}>
                <TextField
                    size="small"
                    value={props.metric.name}
                    onChange={e => props.patch(props.index, { name: e.target.value })}/>
            </TableCell>
            <TableCell>
                <TextField
                    size="small"
                    select
                    value={props.metric.type}
                    onChange={e => props.changeType(props.index, e.target.value as any)}>
                    {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map(key => (
                        <MenuItem key={key} value={key}>{typeLabels[key]}</MenuItem>
                    ))}
                </TextField>
            </TableCell>
            <TableCell>
                <TextField
                    size="small"
                    value={props.metric.relativeImportance}
                    onChange={e => props.patch(props.index, { relativeImportance: parseFloat(e.target.value) })}
                    InputProps={{ type: 'number' }}/>
            </TableCell>
            <TableCell>
                {props.metric.type === 'boolean' ? (
                    <FormControlLabel label="True is better" control={
                        <Checkbox checked={props.metric.trueIsBetter} onChange={e => props.patch(props.index, { trueIsBetter: e.target.checked })}/>
                    }/>
                ) : props.metric.type === 'numeric' ? (
                    <FormControlLabel label="Higher is better" control={
                        <Checkbox checked={props.metric.higherIsBetter} onChange={e => props.patch(props.index, { higherIsBetter: e.target.checked })}/>
                    }/>
                ) : (
                    'N/A'
                )}
            </TableCell>
            <TableCell>
                <Tooltip title="Delete">
                    <IconButton onClick={() => props.delete(props.index)}>
                        <DeleteIcon/>
                    </IconButton>
                </Tooltip>
                <Tooltip title="Move up"><span>
                    <IconButton disabled={props.index === 0} onClick={() => props.move(props.index, -1)}>
                        <ArrowUpwardIcon/>
                    </IconButton>
                </span></Tooltip>
                <Tooltip title="Move down"><span>
                    <IconButton disabled={props.index === props.totalMetrics - 1} onClick={() => props.move(props.index, 1)}>
                        <ArrowDownwardIcon/>
                    </IconButton>
                </span></Tooltip>
            </TableCell>
        </TableRow>
    );
});

function MetricRating(props: { label: string, type: Metric['type'], value: MetricRating, onChange: (newValue: MetricRating) => void }) {
    if (props.type === 'boolean')
        return (
            <FormControlLabel
                label={props.label}
                control={<Checkbox checked={props.value as boolean} onChange={e => props.onChange(e.target.checked)}/>}/>
        );
    
    if (props.type === 'five-star')
        return (<>
            <Typography component="legend">{props.label}</Typography>
            <Rating
                size="small"
                value={props.value as number}
                onChange={(_, newValue) => props.onChange(newValue as number)}/>
        </>);
    
    return (
        <TextField
            size="small"
            label={props.label}
            value={props.value}
            onChange={e => props.onChange(parseFloat(e.target.value))}
            InputProps={{ type: 'number' }}/>
    );
}

function swap<T>(data: T[], i: number, direction: 1 | -1): T[] {
    const clone = [...data];
    const temp = clone[i];
    clone[i] = clone[i + direction];
    clone[i + direction] = temp;
    return clone;
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

const appContainerSx: SxProps = {
    marginTop: '1em',
    marginBottom: '1em',
};

const tabsContainerSx: SxProps = {
    borderBottom: 1,
    borderColor: 'divider',
    marginBottom: '1em',
};
