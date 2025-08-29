import React, { useMemo, useState } from 'react';
import { useHaptic } from '../utils/hapticHooks';
import {
  popularCitiesCache,
  type PopularCity,
} from '../utils/popularCitiesCache';
import type { ThemeColors } from '../utils/themeConfig';
import type { SavedCity } from '../utils/useCityManagement';
import {
  ContextMenu,
  InteractiveWidget,
  ModalSheet,
} from './modernWeatherUI/iOS26Components';
import { StatusBadge } from './modernWeatherUI/IOSComponents';
import { NavigationIcons } from './modernWeatherUI/NavigationIcons';

export interface LocationQuickPicksProps {
  theme: ThemeColors;
  onCitySelected: (
    city: string,
    lat: number,
    lon: number
  ) => void | Promise<void>;
  className?: string;
  onPreSelect?: (displayLabel: string) => void;
  onNotify?: (title: string, message?: string) => void;
  favorites?: SavedCity[];
  onManageFavorites?: () => void;
  onAddFavorite?: (
    city: string,
    lat: number,
    lon: number,
    displayName?: string,
    country?: string,
    state?: string
  ) => void;
  isFavorite?: (city: string, lat: number, lon: number) => boolean;
}

export const LocationQuickPicks: React.FC<LocationQuickPicksProps> = ({
  theme,
  onCitySelected,
  className = '',
  onPreSelect,
  onNotify,
  favorites,
  onManageFavorites,
  onAddFavorite,
  isFavorite,
}) => {
  const haptic = useHaptic();
  const suggestions = useMemo(
    () => popularCitiesCache.getInstantSuggestions(6),
    []
  );
  const [showSheet, setShowSheet] = useState(false);

  const capitals = useMemo(
    () => popularCitiesCache.getCitiesByCategory('capital', 10),
    []
  );
  const northAmerica = useMemo(
    () => popularCitiesCache.getCitiesByContinent('North America', 10),
    []
  );
  const europe = useMemo(
    () => popularCitiesCache.getCitiesByContinent('Europe', 10),
    []
  );

  const pick = async (c: PopularCity) => {
    haptic.selection();
    const label = `${c.name}, ${c.country}`;
    onPreSelect?.(label);
    await onCitySelected(`${c.name}, ${c.countryCode}`, c.lat, c.lon);
    setShowSheet(false);
  };

  return (
    <section
      className={`ios26-forecast-section ${className}`}
      aria-label="Quick city picks"
    >
      {/* Favorites Row */}
      {favorites && favorites.length > 0 && (
        <>
          <div className="ios26-flex ios26-items-center ios26-justify-between ios26-mb-2">
            <div className="ios26-text-title3 ios26-text-primary">
              Favorites
            </div>
            {onManageFavorites && (
              <button
                type="button"
                className="ios26-button ios26-button-tertiary ios26-button-small"
                aria-label="Manage favorites"
                onClick={() => onManageFavorites()}
              >
                Manage
              </button>
            )}
          </div>
          <div className="ios26-widget-grid ios26-mb-3">
            {favorites.slice(0, 6).map(favCity => (
              <ContextMenu
                key={favCity.id}
                theme={theme}
                actions={[
                  {
                    id: 'unfavorite',
                    title: 'Unpin Favorite',
                    icon: <NavigationIcons.Favorites />,
                    onAction: () =>
                      onAddFavorite?.(
                        favCity.name,
                        favCity.latitude,
                        favCity.longitude,
                        favCity.displayName,
                        favCity.country,
                        favCity.state
                      ),
                  },
                  {
                    id: 'share',
                    title: 'Share',
                    icon: <NavigationIcons.Share />,
                    onAction: () => {
                      const text = `${favCity.displayName || favCity.name}`;
                      if (navigator.share) {
                        navigator.share({ title: 'City', text });
                      } else {
                        navigator.clipboard.writeText(text).then(() => {
                          haptic.selection();
                          onNotify?.('Copied to clipboard', text);
                        });
                      }
                    },
                  },
                ]}
              >
                <InteractiveWidget
                  title={favCity.name}
                  size="small"
                  theme={theme}
                  onTap={() =>
                    void (async () => {
                      const label = favCity.displayName || favCity.name;
                      onPreSelect?.(label);
                      await onCitySelected(
                        label,
                        favCity.latitude,
                        favCity.longitude
                      );
                    })()
                  }
                >
                  <div className="ios26-text-center">
                    <div className="ios26-widget-icon" aria-hidden="true">
                      <NavigationIcons.Heart />
                    </div>
                    {favCity.country && (
                      <div className="ios26-widget-secondary-text">
                        {favCity.country}
                      </div>
                    )}
                    <div className="ios26-mt-1">
                      <StatusBadge text="Fav" variant="success" theme={theme} />
                    </div>
                  </div>
                </InteractiveWidget>
              </ContextMenu>
            ))}
          </div>
        </>
      )}

      <div className="ios26-text-title3 ios26-text-primary ios26-mb-2">
        Quick Picks
      </div>
      <div className="ios26-widget-grid">
        {suggestions.map(city => {
          const fav = isFavorite?.(city.name, city.lat, city.lon) ?? false;
          const favActionTitle = fav ? 'Unpin Favorite' : 'Pin to Favorites';
          const category = city.category || 'city';
          const continent = city.continent || '';
          let badgeText: string | undefined;
          if (category === 'capital') {
            badgeText = 'Capital';
          } else if (continent === 'North America') {
            badgeText = 'NA';
          } else if (continent === 'Europe') {
            badgeText = 'EU';
          } else if (continent === 'Asia') {
            badgeText = 'AS';
          } else if (continent === 'South America') {
            badgeText = 'SA';
          } else if (continent === 'Africa') {
            badgeText = 'AF';
          } else if (continent === 'Oceania') {
            badgeText = 'OC';
          }

          return (
            <ContextMenu
              key={`${city.name}-${city.countryCode}`}
              theme={theme}
              actions={[
                {
                  id: 'favorite',
                  title: favActionTitle,
                  icon: fav ? (
                    <NavigationIcons.Favorites />
                  ) : (
                    <NavigationIcons.HeartOutline />
                  ),
                  onAction: () =>
                    onAddFavorite?.(
                      city.name,
                      city.lat,
                      city.lon,
                      `${city.name}, ${city.countryCode}`,
                      city.country,
                      undefined
                    ),
                },
                {
                  id: 'share',
                  title: 'Share',
                  icon: <NavigationIcons.Share />,
                  onAction: () => {
                    const text = `${city.name}, ${city.country}`;
                    if (navigator.share) {
                      navigator.share({ title: 'City', text });
                    } else {
                      navigator.clipboard.writeText(text).then(() => {
                        haptic.selection();
                        onNotify?.('Copied to clipboard', text);
                      });
                    }
                  },
                },
              ]}
            >
              <InteractiveWidget
                title={city.name}
                size="small"
                theme={theme}
                onTap={() => void pick(city)}
              >
                <div className="ios26-text-center">
                  <div className="ios26-widget-icon" aria-hidden="true">
                    {fav ? (
                      <NavigationIcons.Heart />
                    ) : (
                      <NavigationIcons.Location />
                    )}
                  </div>
                  <div className="ios26-widget-secondary-text">
                    {city.country}
                  </div>
                  {badgeText && (
                    <div className="ios26-mt-1">
                      <StatusBadge
                        text={badgeText}
                        variant="info"
                        theme={theme}
                      />
                    </div>
                  )}
                </div>
              </InteractiveWidget>
            </ContextMenu>
          );
        })}

        <InteractiveWidget
          key="more-cities"
          title="More Cities"
          size="small"
          theme={theme}
          onTap={() => setShowSheet(true)}
        >
          <div className="ios26-text-center">
            <div className="ios26-widget-icon" aria-hidden="true">
              <NavigationIcons.Add />
            </div>
            <div className="ios26-widget-secondary-text">Browse lists</div>
          </div>
        </InteractiveWidget>
      </div>

      <ModalSheet
        isVisible={showSheet}
        onClose={() => setShowSheet(false)}
        title="Popular Cities"
        detents={['medium', 'large']}
        theme={theme}
      >
        <div className="ios26-forecast-section">
          <h4 className="ios26-text-headline ios26-text-primary ios26-mb-2">
            Capitals
          </h4>
          <ul className="ios26-list">
            {capitals.map(c => (
              <li key={`cap-${c.name}-${c.countryCode}`}>
                <button
                  className="ios26-list-item"
                  onClick={() => void pick(c)}
                >
                  <div>
                    <NavigationIcons.Info /> {c.name}
                  </div>
                  <div className="ios26-text-footnote ios26-text-secondary">
                    {c.country}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <h4 className="ios26-text-headline ios26-text-primary ios26-mt-4 ios26-mb-2">
            North America
          </h4>
          <ul className="ios26-list">
            {northAmerica.map(c => (
              <li key={`na-${c.name}-${c.countryCode}`}>
                <button
                  className="ios26-list-item"
                  onClick={() => void pick(c)}
                >
                  <div>
                    <NavigationIcons.Info /> {c.name}
                  </div>
                  <div className="ios26-text-footnote ios26-text-secondary">
                    {c.country}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          <h4 className="ios26-text-headline ios26-text-primary ios26-mt-4 ios26-mb-2">
            Europe
          </h4>
          <ul className="ios26-list">
            {europe.map(c => (
              <li key={`eu-${c.name}-${c.countryCode}`}>
                <button
                  className="ios26-list-item"
                  onClick={() => void pick(c)}
                >
                  <div>
                    <NavigationIcons.Info /> {c.name}
                  </div>
                  <div className="ios26-text-footnote ios26-text-secondary">
                    {c.country}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </ModalSheet>
    </section>
  );
};

export default LocationQuickPicks;
