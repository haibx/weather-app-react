import * as React from "react";
import { useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import AppBar from "@mui/material/AppBar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { MenuItem, Select } from "@mui/material";
import { Cloud } from "@mui/icons-material";
import _ from "lodash";
import axios from "axios";

// HERE MAP SERVICE API KEY
const HERE_API_KEY = "8dTmRq2k6pnJ3VC988cOBysiw8Tv1hXvFcXypShxk1U";

// FIXED LOCATION
const FIXED_LOCATION = "21.065272866067104,105.78708307620256";

// API TO SEARCH LOCATION DATA FROM HERE SERVICE (free)
const SEARCH_API = `https://discover.search.hereapi.com/v1/discover?at=${FIXED_LOCATION}&limit=5&apiKey=${HERE_API_KEY}&q=`;

// OPEN WEATHER API KEY
const OPENWEATHER_API_KEY = "6720bd563d231c21543c433f23d0a30d";

// API EVERY 3 HOURS WEATHER FORECAST DATA ON 5 DAYS
// use this instead of update every hour becasue openweather just free this api
const FORECAST_API = `https://api.openweathermap.org/data/2.5/forecast?units=metric&appid=${OPENWEATHER_API_KEY}`;

// API TO GET WEATHER FORECAST ICON *.png
const WEATHER_ICON = "https://openweathermap.org/img/w/";

// 3 HOUR BY MILISECONDS
const TIME_THREE_HOUR = 1000 * 60 * 3;

// THEME INIT
const theme = createTheme();

// STRING CONVERT FUNCTION TO CAPITALIZE FIRST LETTER OF STRING
const capitalizeFirstLowercaseRest = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const Home = () => {
    // init value
    // store location after search
    const [value, setValue] = useState(null);
    // get value of search input text
    const [inputValue, setInputValue] = useState("");
    // suggestion list get from here service
    const [options, setOptions] = useState([]);
    // list weather forecast get from openweather service on 5 days
    const [weatherForecast, setWeatherForecast] = useState([]);
    // setting number will be show forecast
    const [showDay, setShowDay] = useState(1);
    // list forecast show after filtered by show day
    const [forecastList, setForecastList] = useState([]);
    // variable to trigger update weather forecast list
    const [time, setTime] = useState(Date.now());

    // function get forecast data from server after select location
    const handleSelectedLocation = (localtionInput) => {
        if (localtionInput === null) {
            setOptions([]);
            setForecastList([]);
            setWeatherForecast([]);
            return undefined;
        }
        let lat = localtionInput.position.lat;
        let lng = localtionInput.position.lng;

        axios
            .get(`${FORECAST_API}&lat=${lat}&lon=${lng}`)
            .then((response) => {
                if (response) {
                    setWeatherForecast(response.data.list);
                }
            })
            .catch();
    };

    // function to trigger update forecast after every 3 hours
    React.useEffect(() => {
        const interval = setInterval(() => {
            if (!_.isEmpty(value)) {
                handleSelectedLocation(value);
            }
            setTime(Date.now());
        }, TIME_THREE_HOUR);

        return () => {
            clearInterval(interval);
        };
    });

    // track and update list forecast show on screen every time show day setting changed
    // not call to server to get data, just update list from data which stored in 1st call
    React.useEffect(() => {
        if (!_.isEmpty(weatherForecast)) {
            let dayList = weatherForecast.map((value) => {
                return value.dt_txt.substring(0, 10);
            });

            dayList = _.uniqBy(dayList).slice(0, showDay);
            let filteredForecast = weatherForecast.filter((value) =>
                dayList.includes(value.dt_txt.substring(0, 10))
            );
            setForecastList(filteredForecast);
        }
    }, [weatherForecast, showDay]);

    // search location and update
    React.useEffect(() => {
        if (inputValue === "") {
            if (!_.isEmpty(options)) {
                setOptions([]);
                setForecastList([]);
                setWeatherForecast([]);
            }
            return undefined;
        }

        axios
            .get(SEARCH_API + inputValue)
            .then((response) => {
                let locationData = response.data.items;
                let locationArray = [];
                Object.keys(locationData).forEach((key) => {
                    locationArray.push({
                        id: locationData[key].id,
                        title: locationData[key].title,
                        position: locationData[key].position,
                    });
                });

                if (!_.isEmpty(locationArray)) {
                    setOptions(locationArray);
                }
            })
            .catch((error) => console.log(error));
    }, [inputValue]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppBar position="relative">
                <Toolbar>
                    <Cloud sx={{ mr: 2 }} />
                    <Typography variant="h6" color="inherit" noWrap>
                        Weather
                    </Typography>
                </Toolbar>
            </AppBar>
            <main>
                {/* Hero unit */}
                <Box
                    sx={{
                        bgcolor: "background.paper",
                        pt: 8,
                        pb: 6,
                    }}
                >
                    <Container maxWidth="sm">
                        <Typography
                            component="h1"
                            variant="h2"
                            align="center"
                            color="text.primary"
                            gutterBottom
                        >
                            Weather Forecast
                        </Typography>
                    </Container>
                </Box>
                <Container sx={{ py: 8 }} maxWidth="md">
                    {/* End hero unit */}
                    <Grid container spacing={4} marginBottom={5}>
                        <Grid item key={100} xs={12} sm={12} md={12}>
                            <Autocomplete
                                id="search-location-input"
                                getOptionLabel={(option) =>
                                    typeof option === "string"
                                        ? option
                                        : option.title
                                }
                                isOptionEqualToValue={(option, value) =>
                                    option.id === value.id
                                }
                                filterOptions={(x) => x}
                                options={options}
                                autoComplete
                                includeInputInList
                                filterSelectedOptions
                                value={value}
                                noOptionsText="No locations"
                                onChange={(event, newValue) => {
                                    setValue(newValue);
                                    handleSelectedLocation(newValue);
                                }}
                                // catch on input change to search location
                                // use debounce to prevent call api too much every key press, just call api every 400 ms
                                onInputChange={_.debounce(
                                    (event, newInputValue) => {
                                        setInputValue(newInputValue);
                                    },
                                    400
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Add a location"
                                        fullWidth
                                    />
                                )}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={4}>
                        <Grid item xs={12} sm={8} md={8}>
                            <Typography
                                variant="h5"
                                align="left"
                                color="text.secondary"
                            >
                                Weather forecast show in:
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4} md={4}>
                            <Select
                                fullWidth
                                labelId="demo-simple-select-label"
                                id="demo-simple-select"
                                value={showDay}
                                onChange={(event) => {
                                    setShowDay(event.target.value);
                                }}
                            >
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <MenuItem
                                        key={"select_" + value}
                                        value={value}
                                    >
                                        {value} Day
                                    </MenuItem>
                                ))}
                            </Select>
                        </Grid>
                        {forecastList.map((forecast) => {
                            return (
                                <Grid
                                    item
                                    key={forecast.dt}
                                    xs={12}
                                    sm={6}
                                    md={4}
                                >
                                    <Card
                                        sx={{
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                        }}
                                    >
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography
                                                gutterBottom
                                                variant="h5"
                                                component="h2"
                                            >
                                                <img
                                                    src={
                                                        WEATHER_ICON +
                                                        forecast.weather[0]
                                                            .icon +
                                                        ".png"
                                                    }
                                                    alt={
                                                        forecast.weather[0]
                                                            .description
                                                    }
                                                />
                                                {capitalizeFirstLowercaseRest(
                                                    forecast.weather[0]
                                                        .description
                                                )}
                                            </Typography>
                                            <Typography>
                                                <b>Time:</b> {forecast.dt_txt}{" "}
                                                <br />
                                                <b>Max Temperature:</b>{" "}
                                                {forecast.main.temp_max}&#8451;
                                                <br />
                                                <b>Min Temperature:</b>{" "}
                                                {forecast.main.temp_min}&#8451;
                                                <br />
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Container>
            </main>
            {/* Footer */}
            <Box sx={{ bgcolor: "background.paper", p: 6 }} component="footer">
                <Typography
                    variant="subtitle1"
                    align="center"
                    color="text.secondary"
                    component="p"
                >
                    A Simpe Weather Forecast
                </Typography>
            </Box>
            {/* End footer */}
        </ThemeProvider>
    );
};

export default Home;
