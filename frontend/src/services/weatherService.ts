import axios from 'axios';

const OPENWEATHER_API_KEY = 'fec2901f42ac220edfb5877d4cf36ac8';
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  city: string;
}

class WeatherService {
  /**
   * Get weather by coordinates
   */
  async getWeatherByCoords(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
        },
      });

      return this.parseWeatherData(response.data);
    } catch (error) {
      console.error('Error fetching weather by coords:', error);
      throw error;
    }
  }

  /**
   * Get weather by city name
   */
  async getWeatherByCity(city: string): Promise<WeatherData> {
    try {
      const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
        params: {
          q: city,
          appid: OPENWEATHER_API_KEY,
          units: 'metric',
        },
      });

      return this.parseWeatherData(response.data);
    } catch (error) {
      console.error('Error fetching weather by city:', error);
      throw error;
    }
  }

  /**
   * Parse weather API response
   */
  private parseWeatherData(data: any): WeatherData {
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      city: data.name,
    };
  }

  /**
   * Get weather icon name for Ionicons based on OpenWeather icon code
   */
  getWeatherIconName(iconCode: string): string {
    const iconMap: { [key: string]: string } = {
      '01d': 'sunny',           // clear sky day
      '01n': 'moon',            // clear sky night
      '02d': 'partly-sunny',    // few clouds day
      '02n': 'cloudy-night',    // few clouds night
      '03d': 'cloud',           // scattered clouds
      '03n': 'cloud',           // scattered clouds
      '04d': 'cloudy',          // broken clouds
      '04n': 'cloudy',          // broken clouds
      '09d': 'rainy',           // shower rain
      '09n': 'rainy',           // shower rain
      '10d': 'rainy',           // rain day
      '10n': 'rainy',           // rain night
      '11d': 'thunderstorm',    // thunderstorm
      '11n': 'thunderstorm',    // thunderstorm
      '13d': 'snow',            // snow
      '13n': 'snow',            // snow
      '50d': 'cloud',           // mist
      '50n': 'cloud',           // mist
    };

    return iconMap[iconCode] || 'cloud';
  }

  /**
   * Get weather emoji based on description
   */
  getWeatherEmoji(description: string): string {
    const desc = description.toLowerCase();
    if (desc.includes('clear')) return '☀️';
    if (desc.includes('cloud')) return '☁️';
    if (desc.includes('rain') || desc.includes('drizzle')) return '🌧️';
    if (desc.includes('thunder')) return '⛈️';
    if (desc.includes('snow')) return '❄️';
    if (desc.includes('mist') || desc.includes('fog')) return '🌫️';
    return '🌤️';
  }
}

export const weatherService = new WeatherService();

