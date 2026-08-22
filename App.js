import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Linking,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const API_KEY = 'c45a857c193f6302f2b5061c3b85e743';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w780';

const GENRES = [
  { id: 'all', name: '🔥 All' },
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Sci-Fi' }
];

export default function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('popular');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedMovies, setSavedMovies] = useState([]);

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [cast, setCast] = useState([]);
  const [providers, setProviders] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [trailerKey, setTrailerKey] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const toggleSaveMovie = (movie) => {
    const exists = savedMovies.some((m) => m.id === movie.id);
    if (exists) {
      setSavedMovies(savedMovies.filter((m) => m.id !== movie.id));
    } else {
      setSavedMovies([movie, ...savedMovies]);
    }
  };

  const fetchMovies = useCallback(async () => {
    if (tab === 'saved') {
      setMovies(savedMovies);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let url = `${BASE_URL}/movie/${tab}?api_key=${API_KEY}&language=en-US&page=1`;

      if (searchQuery.trim().length > 0) {
        url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`;
      } else if (selectedGenre !== 'all') {
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${selectedGenre}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      setMovies(json.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [tab, selectedGenre, searchQuery, savedMovies]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const openMovieDetails = async (movie) => {
    setSelectedMovie(movie);
    setModalVisible(true);
    setDetailLoading(true);

    try {
      const credRes = await fetch(`${BASE_URL}/movie/${movie.id}/credits?api_key=${API_KEY}`);
      const credJson = await credRes.json();
      setCast(credJson.cast ? credJson.cast.slice(0, 10) : []);

      const vidRes = await fetch(`${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}`);
      const vidJson = await vidRes.json();
      const officialTrailer = vidJson.results ? vidJson.results.find((v) => v.type === 'Trailer' && v.site === 'YouTube') : null;
      setTrailerKey(officialTrailer ? officialTrailer.key : null);

      const provRes = await fetch(`${BASE_URL}/movie/${movie.id}/watch/providers?api_key=${API_KEY}`);
      const provJson = await provRes.json();
      const regionData = provJson.results ? (provJson.results.IN || provJson.results.US) : null;
      setProviders(regionData ? (regionData.flatrate || regionData.buy || []) : []);

      const simRes = await fetch(`${BASE_URL}/movie/${movie.id}/similar?api_key=${API_KEY}`);
      const simJson = await simRes.json();
      setSimilar(simJson.results ? simJson.results.slice(0, 8) : []);
    } catch (e) {
      console.log('Error loading details:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const isSaved = (id) => savedMovies.some((m) => m.id === id);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎬 All Movies & Trailers</Text>
      </View>

      <View style={styles.tabContainer}>
        {['popular', 'upcoming', 'top_rated', 'saved'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabButton, tab === t && styles.tabButtonActive]}
            onPress={() => {
              setTab(t);
              setSearchQuery('');
            }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'popular' ? 'Popular' : t === 'upcoming' ? 'Upcoming' : t === 'top_rated' ? 'Top Rated' : `Saved (${savedMovies.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab !== 'saved' && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search millions of movies..."
            placeholderTextColor="#777"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(txt) => setSearchQuery(txt)}
          />
        </View>
      )}

      {tab !== 'saved' && !searchQuery && (
        <View style={{ height: 42, marginBottom: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreList}>
            {GENRES.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.genrePill, selectedGenre === g.id && styles.genrePillActive]}
                onPress={() => setSelectedGenre(g.id)}
              >
                <Text style={[styles.genreText, selectedGenre === g.id && styles.genreTextActive]}>{g.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 50 }} />
      ) : movies.length === 0 ? (
        <View style={styles.emptyView}>
          <Ionicons name="film-outline" size={60} color="#444" />
          <Text style={styles.emptyText}>No movies found.</Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.movieList}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.movieCard} activeOpacity={0.8} onPress={() => openMovieDetails(item)}>
              <Image
                source={{
                  uri: item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : 'https://via.placeholder.com/300x450/1c1c1e/ffffff?text=No+Poster'
                }}
                style={styles.poster}
              />
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.releaseDate}>📅 {item.release_date || 'N/A'}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.rating}>⭐ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10</Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.detailBtn} onPress={() => openMovieDetails(item)}>
                    <Ionicons name="play" size={12} color="#fff" />
                    <Text style={styles.detailBtnText}> Details & Trailer</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.saveIcon} onPress={() => toggleSaveMovie(item)}>
                <Ionicons
                  name={isSaved(item.id) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isSaved(item.id) ? '#E50914' : '#fff'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />
          <ScrollView>
            <View style={styles.backdropBox}>
              <Image
                source={{
                  uri: selectedMovie && selectedMovie.backdrop_path
                    ? `${BACKDROP_BASE}${selectedMovie.backdrop_path}`
                    : (selectedMovie && selectedMovie.poster_path ? `${IMAGE_BASE}${selectedMovie.poster_path}` : 'https://via.placeholder.com/500x280')
                }}
                style={styles.backdropImage}
              />
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>{selectedMovie ? selectedMovie.title : ''}</Text>
                <TouchableOpacity onPress={() => selectedMovie && toggleSaveMovie(selectedMovie)}>
                  <Ionicons
                    name={selectedMovie && isSaved(selectedMovie.id) ? 'heart' : 'heart-outline'}
                    size={28}
                    color={selectedMovie && isSaved(selectedMovie.id) ? '#E50914' : '#fff'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                ⭐ {selectedMovie && selectedMovie.vote_average ? selectedMovie.vote_average.toFixed(1) : 'N/A'}/10 | 📅 {selectedMovie ? selectedMovie.release_date : ''}
              </Text>

              {trailerKey ? (
                <TouchableOpacity
                  style={styles.trailerBtn}
                  onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`)}
                >
                  <Ionicons name="logo-youtube" size={20} color="#fff" />
                  <Text style={styles.trailerBtnText}> Watch Official Trailer</Text>
                </TouchableOpacity>
              ) : null}

              <Text style={styles.sectionHeader}>Overview</Text>
              <Text style={styles.overviewText}>{selectedMovie && selectedMovie.overview ? selectedMovie.overview : 'No description available.'}</Text>

              {detailLoading ? (
                <ActivityIndicator size="small" color="#E50914" style={{ marginVertical: 20 }} />
              ) : (
                <>
                  {providers.length > 0 ? (
                    <View style={{ marginTop: 20 }}>
                      <Text style={styles.sectionHeader}>Where to Watch (OTT)</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        {providers.map((p, idx) => (
                          <View key={idx} style={styles.providerItem}>
                            <Image
                              source={{ uri: `https://image.tmdb.org/t/p/w200${p.logo_path}` }}
                              style={styles.providerLogo}
                            />
                            <Text style={styles.providerName} numberOfLines={1}>{p.provider_name}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}

                  {cast.length > 0 ? (
                    <View style={{ marginTop: 20 }}>
                      <Text style={styles.sectionHeader}>Top Cast</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        {cast.map((c) => (
                          <View key={c.id} style={styles.castCard}>
                            <Image
                              source={{
                                uri: c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : 'https://via.placeholder.com/100x150/2c2c2e/ffffff?text=Actor'
                              }}
                              style={styles.castImage}
                            />
                            <Text style={styles.castName} numberOfLines={1}>{c.name}</Text>
                            <Text style={styles.castChar} numberOfLines={1}>{c.character}</Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}

                  {similar.length > 0 ? (
                    <View style={{ marginTop: 20, marginBottom: 30 }}>
                      <Text style={styles.sectionHeader}>Similar Movies</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        {similar.map((sim) => (
                          <TouchableOpacity key={sim.id} style={styles.similarCard} onPress={() => openMovieDetails(sim)}>
                            <Image
                              source={{
                                uri: sim.poster_path ? `${IMAGE_BASE}${sim.poster_path}` : 'https://via.placeholder.com/100x150'
                              }}
                              style={styles.similarPoster}
                            />
                            <Text style={styles.similarTitle} numberOfLines={1}>{sim.title}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#E50914' },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 10,
    justifyContent: 'space-between'
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1E1E1E'
  },
  tabButtonActive: { backgroundColor: '#E50914' },
  tabText: { color: '#888', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 8
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  genreList: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#222'
  },
  genrePillActive: { backgroundColor: '#E50914' },
  genreText: { color: '#999', fontSize: 13, fontWeight: '600' },
  genreTextActive: { color: '#fff' },
  movieList: { paddingHorizontal: 16, paddingBottom: 20 },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  poster: { width: 95, height: 140, borderRadius: 8 },
  movieInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  releaseDate: { color: '#888', fontSize: 12, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rating: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row' },
  detailBtn: {
    backgroundColor: '#333',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  saveIcon: { position: 'absolute', top: 12, right: 12, padding: 4 },
  emptyView: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 10 },

  modalContainer: { flex: 1, backgroundColor: '#121212' },
  backdropBox: { width: '100%', height: 220, position: 'relative' },
  backdropImage: { width: '100%', height: '100%' },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 6
  },
  modalBody: { padding: 16 },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900', flex: 1, marginRight: 10 },
  modalSubtitle: { color: '#999', fontSize: 13, marginTop: 4, marginBottom: 12 },
  trailerBtn: {
    backgroundColor: '#E50914',
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  trailerBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  sectionHeader: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  overviewText: { color: '#bbb', fontSize: 13, lineHeight: 19 },
  providerItem: { alignItems: 'center', marginRight: 14, width: 60 },
  providerLogo: { width: 48, height: 48, borderRadius: 10, marginBottom: 4 },
  providerName: { color: '#888', fontSize: 10, textAlign: 'center' },
  castCard: { width: 85, marginRight: 12, alignItems: 'center' },
  castImage: { width: 75, height: 95, borderRadius: 8, marginBottom: 4 },
  castName: { color: '#fff', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  castChar: { color: '#777', fontSize: 10, textAlign: 'center' },
  similarCard: { width: 90, marginRight: 12 },
  similarPoster: { width: 90, height: 130, borderRadius: 8, marginBottom: 4 },
  similarTitle: { color: '#aaa', fontSize: 11, textAlign: 'center' }
});
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Sci-Fi' },
];

export default function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('popular');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedMovies, setSavedMovies] = useState([]);

  // Detail Modal States
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [cast, setCast] = useState([]);
  const [providers, setProviders] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [trailerKey, setTrailerKey] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadSavedMovies();
  }, []);

  const loadSavedMovies = async () => {
    try {
      const data = await AsyncStorage.getItem('saved_movies');
      if (data) setSavedMovies(JSON.parse(data));
    } catch (e) {
      console.log('Error loading saved movies:', e);
    }
  };

  const toggleSaveMovie = async (movie) => {
    try {
      let updated;
      const exists = savedMovies.some((m) => m.id === movie.id);
      if (exists) {
        updated = savedMovies.filter((m) => m.id !== movie.id);
      } else {
        updated = [movie, ...savedMovies];
      }
      setSavedMovies(updated);
      await AsyncStorage.setItem('saved_movies', JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving movie:', e);
    }
  };

  const fetchMovies = useCallback(async () => {
    if (tab === 'saved') {
      setMovies(savedMovies);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let url = `${BASE_URL}/movie/${tab}?api_key=${API_KEY}&language=en-US&page=1`;

      if (searchQuery.trim().length > 0) {
        url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
          searchQuery
        )}`;
      } else if (selectedGenre !== 'all') {
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${selectedGenre}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      setMovies(json.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [tab, selectedGenre, searchQuery, savedMovies]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const openMovieDetails = async (movie) => {
    setSelectedMovie(movie);
    setModalVisible(true);
    setDetailLoading(true);

    try {
      const credRes = await fetch(
        `${BASE_URL}/movie/${movie.id}/credits?api_key=${API_KEY}`
      );
      const credJson = await credRes.json();
      setCast(credJson.cast ? credJson.cast.slice(0, 10) : []);

      const vidRes = await fetch(
        `${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}`
      );
      const vidJson = await vidRes.json();
      const officialTrailer = vidJson.results?.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube'
      );
      setTrailerKey(officialTrailer ? officialTrailer.key : null);

      const provRes = await fetch(
        `${BASE_URL}/movie/${movie.id}/watch/providers?api_key=${API_KEY}`
      );
      const provJson = await provRes.json();
      const regionData = provJson.results?.IN || provJson.results?.US;
      setProviders(regionData?.flatrate || regionData?.buy || []);

      const simRes = await fetch(
        `${BASE_URL}/movie/${movie.id}/similar?api_key=${API_KEY}`
      );
      const simJson = await simRes.json();
      setSimilar(simJson.results ? simJson.results.slice(0, 8) : []);
    } catch (e) {
      console.log('Error loading details:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const isSaved = (id) => savedMovies.some((m) => m.id === id);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎬 All Movies & Trailers</Text>
      </View>

      {/* Top Tabs */}
      <View style={styles.tabContainer}>
        {['popular', 'upcoming', 'top_rated', 'saved'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabButton, tab === t && styles.tabButtonActive]}
            onPress={() => {
              setTab(t);
              setSearchQuery('');
            }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'popular'
                ? 'Popular'
                : t === 'upcoming'
                ? 'Upcoming'
                : t === 'top_rated'
                ? 'Top Rated'
                : `Saved (${savedMovies.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input */}
      {tab !== 'saved' && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search millions of movies..."
            placeholderTextColor="#777"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(txt) => setSearchQuery(txt)}
          />
        </View>
      )}

      {/* Genre Filter */}
      {tab !== 'saved' && !searchQuery && (
        <View style={{ height: 42, marginBottom: 10 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreList}
          >
            {GENRES.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.genrePill,
                  selectedGenre === g.id && styles.genrePillActive,
                ]}
                onPress={() => setSelectedGenre(g.id)}
              >
                <Text
                  style={[
                    styles.genreText,
                    selectedGenre === g.id && styles.genreTextActive,
                  ]}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Movie List */}
      {loading ? (
        <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 50 }} />
      ) : movies.length === 0 ? (
        <View style={styles.emptyView}>
          <Ionicons name="film-outline" size={60} color="#444" />
          <Text style={styles.emptyText}>No movies found.</Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.movieList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.movieCard}
              activeOpacity={0.8}
              onPress={() => openMovieDetails(item)}
            >
              <Image
                source={{
                  uri: item.poster_path
                    ? `${IMAGE_BASE}${item.poster_path}`
                    : 'https://via.placeholder.com/300x450/1c1c1e/ffffff?text=No+Poster',
                }}
                style={styles.poster}
              />
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.releaseDate}>
                  📅 {item.release_date || 'N/A'}
                </Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.rating}>
                    ⭐ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => openMovieDetails(item)}
                  >
                    <Ionicons name="play" size={12} color="#fff" />
                    <Text style={styles.detailBtnText}> Details & Trailer</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveIcon}
                onPress={() => toggleSaveMovie(item)}
              >
                <Ionicons
                  name={isSaved(item.id) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isSaved(item.id) ? '#E50914' : '#fff'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Complete Movie Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />
          <ScrollView>
            {/* Backdrop Banner */}
            <View style={styles.backdropBox}>
              <Image
                source={{
                  uri: selectedMovie?.backdrop_path
                    ? `${BACKDROP_BASE}${selectedMovie.backdrop_path}`
                    : `${IMAGE_BASE}${selectedMovie?.poster_path}`,
                }}
                style={styles.backdropImage}
              />
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>{selectedMovie?.title}</Text>
                <TouchableOpacity
                  onPress={() => selectedMovie && toggleSaveMovie(selectedMovie)}
                >
                  <Ionicons
                    name={
                      selectedMovie && isSaved(selectedMovie.id)
                        ? 'heart'
                        : 'heart-outline'
                    }
                    size={28}
                    color={
                      selectedMovie && isSaved(selectedMovie.id) ? '#E50914' : '#fff'
                    }
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                ⭐ {selectedMovie?.vote_average?.toFixed(1)}/10 | 📅{' '}
                {selectedMovie?.release_date}
              </Text>

              {/* YouTube Trailer Button */}
              {trailerKey && (
                <TouchableOpacity
                  style={styles.trailerBtn}
                  onPress={() =>
                    Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`)
                  }
                >
                  <Ionicons name="logo-youtube" size={20} color="#fff" />
                  <Text style={styles.trailerBtnText}> Watch Official Trailer</Text>
                </TouchableOpacity>
              )}

              {/* Overview */}
              <Text style={styles.sectionHeader}>Overview</Text>
              <Text style={styles.overviewText}>
                {selectedMovie?.overview || 'No description available.'}
              </Text>

              {detailLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#E50914"
                  style={{ marginVertical: 20 }}
                />
              ) : (
                <>
                  {/* Where to Watch (OTT Providers) */}
                  {providers.length > 0 && (
                    <View style={{ marginTop: 20 }}>
                      <Text style={styles.sectionHeader}>Where to Watch</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 8 }}
                      >
                        {providers.map((p, idx) => (
                          <View key={idx} style={styles.providerItem}>
                            <Image
                              source={{
                                uri: `https://image.tmdb.org/t/p/w200${p.logo_path}`,
                              }}
                              style={styles.providerLogo}
                            />
                            <Text style={styles.providerName} numberOfLines={1}>
                              {p.provider_name}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Top Cast */}
                  {cast.length > 0 && (
                    <View style={{ marginTop: 20 }}>
                      <Text style={styles.sectionHeader}>Top Cast</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 8 }}
                      >
                        {cast.map((c) => (
                          <View key={c.id} style={styles.castCard}>
                            <Image
                              source={{
                                uri: c.profile_path
                                  ? `https://image.tmdb.org/t/p/w200${c.profile_path}`
                                  : 'https://via.placeholder.com/100x150/2c2c2e/ffffff?text=Actor',
                              }}
                              style={styles.castImage}
                            />
                            <Text style={styles.castName} numberOfLines={1}>
                              {c.name}
                            </Text>
                            <Text style={styles.castChar} numberOfLines={1}>
                              {c.character}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Similar Recommendations */}
                  {similar.length > 0 && (
                    <View style={{ marginTop: 20, marginBottom: 30 }}>
                      <Text style={styles.sectionHeader}>Similar Movies</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 8 }}
                      >
                        {similar.map((sim) => (
                          <TouchableOpacity
                            key={sim.id}
                            style={styles.similarCard}
                            onPress={() => openMovieDetails(sim)}
                          >
                            <Image
                              source={{
                                uri: sim.poster_path
                                  ? `${IMAGE_BASE}${sim.poster_path}`
                                  : 'https://via.placeholder.com/100x150',
                              }}
                              style={styles.similarPoster}
                            />
                            <Text style={styles.similarTitle} numberOfLines={1}>
                              {sim.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#E50914' },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
  },
  tabButtonActive: { backgroundColor: '#E50914' },
  tabText: { color: '#888', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  genreList: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#222',
  },
  genrePillActive: { backgroundColor: '#E50914' },
  genreText: { color: '#999', fontSize: 13, fontWeight: '600' },
  genreTextActive: { color: '#fff' },
  movieList: { paddingHorizontal: 16, paddingBottom: 20 },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  poster: { width: 95, height: 140, borderRadius: 8 },
  movieInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  releaseDate: { color: '#888', fontSize: 12, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rating: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row' },
  detailBtn: {
    backgroundColor: '#333',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  saveIcon: { position: 'absolute', top: 12, right: 12, padding: 4 },
  emptyView: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 10 },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: '#121212' },
  backdropBox: { width: '100%', height: 220, position: 'relative' },
  backdropImage: { width: '100%', height: '100%' },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 6,
  },
  modalBody: { padding: 16 },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '900', flex: 1, marginRight: 10 },
  modalSubtitle: { color: '#999', fontSize: 13, marginTop: 4, marginBottom: 12 },
  trailerBtn: {
    backgroundColor: '#E50914',
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: '  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Sci-Fi' },
];

export default function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('popular'); // popular, upcoming, top_rated, saved
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedMovies, setSavedMovies] = useState([]);

  // Detail Modal States
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [cast, setCast] = useState([]);
  const [providers, setProviders] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [trailerKey, setTrailerKey] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load Saved Movies from Local Storage
  useEffect(() => {
    loadSavedMovies();
  }, []);

  const loadSavedMovies = async () => {
    try {
      const data = await AsyncStorage.getItem('saved_movies');
      if (data) setSavedMovies(JSON.parse(data));
    } catch (e) {
      console.log('Error loading saved movies:', e);
    }
  };

  const toggleSaveMovie = async (movie) => {
    try {
      let updated;
      const exists = savedMovies.some((m) => m.id === movie.id);
      if (exists) {
        updated = savedMovies.filter((m) => m.id !== movie.id);
      } else {
        updated = [movie, ...savedMovies];
      }
      setSavedMovies(updated);
      await AsyncStorage.setItem('saved_movies', JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving movie:', e);
    }
  };

  // Fetch Movies List
  const fetchMovies = useCallback(async () => {
    if (tab === 'saved') {
      setMovies(savedMovies);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let url = `${BASE_URL}/movie/${tab}?api_key=${API_KEY}&language=en-US&page=1`;

      if (searchQuery.trim().length > 0) {
        url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(
          searchQuery
        )}`;
      } else if (selectedGenre !== 'all') {
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${selectedGenre}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      setMovies(json.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [tab, selectedGenre, searchQuery, savedMovies]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  // Fetch Movie Details: Cast, Video, Providers & Similar
  const openMovieDetails = async (movie) => {
    setSelectedMovie(movie);
    setModalVisible(true);
    setDetailLoading(true);

    try {
      // 1. Credits (Cast)
      const credRes = await fetch(
        `${BASE_URL}/movie/${movie.id}/credits?api_key=${API_KEY}`
      );
      const credJson = await credRes.json();
      setCast(credJson.cast ? credJson.cast.slice(0, 10) : []);

      // 2. Videos (Trailer)
      const vidRes = await fetch(
        `${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}`
      );
      const vidJson = await vidRes.json();
      const officialTrailer = vidJson.results?.find(
        (v) => v.type === 'Trailer' && v.site === 'YouTube'
      );
      setTrailerKey(officialTrailer ? officialTrailer.key : null);

      // 3. Watch Providers (OTT)
      const provRes = await fetch(
        `${BASE_URL}/movie/${movie.id}/watch/providers?api_key=${API_KEY}`
      );
      const provJson = await provRes.json();
      const regionData = provJson.results?.IN || provJson.results?.US;
      setProviders(regionData?.flatrate || regionData?.buy || []);

      // 4. Similar Movies
      const simRes = await fetch(
        `${BASE_URL}/movie/${movie.id}/similar?api_key=${API_KEY}`
      );
      const simJson = await simRes.json();
      setSimilar(simJson.results ? simJson.results.slice(0, 8) : []);
    } catch (e) {
      console.log('Error loading details:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  const isSaved = (id) => savedMovies.some((m) => m.id === id);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎬 Movie Hub</Text>
      </View>

      {/* Top Tabs */}
      <View style={styles.tabContainer}>
        {['popular', 'upcoming', 'top_rated', 'saved'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tabButton, tab === t && styles.tabButtonActive]}
            onPress={() => {
              setTab(t);
              setSearchQuery('');
            }}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'popular'
                ? 'Popular'
                : t === 'upcoming'
                ? 'Upcoming'
                : t === 'top_rated'
                ? 'Top Rated'
                : `Saved (${savedMovies.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input */}
      {tab !== 'saved' && (
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search millions of movies..."
            placeholderTextColor="#777"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(txt) => setSearchQuery(txt)}
          />
        </View>
      )}

      {/* Genre Filter */}
      {tab !== 'saved' && !searchQuery && (
        <View style={{ height: 42, marginBottom: 10 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreList}
          >
            {GENRES.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.genrePill,
                  selectedGenre === g.id && styles.genrePillActive,
                ]}
                onPress={() => setSelectedGenre(g.id)}
              >
                <Text
                  style={[
                    styles.genreText,
                    selectedGenre === g.id && styles.genreTextActive,
                  ]}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Movies Grid / List */}
      {loading ? (
        <ActivityIndicator size="large" color="#E50914" style={{ marginTop: 50 }} />
      ) : movies.length === 0 ? (
        <View style={styles.emptyView}>
          <Ionicons name="film-outline" size={60} color="#444" />
          <Text style={styles.emptyText}>No movies found.</Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.movieList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.movieCard}
              activeOpacity={0.8}
              onPress={() => openMovieDetails(item)}
            >
              <Image
                source={{
                  uri: item.poster_path
                    ? `${IMAGE_BASE}${item.poster_path}`
                    : 'https://via.placeholder.com/300x450/1c1c1e/ffffff?text=No+Poster',
                }}
                style={styles.poster}
              />
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.releaseDate}>
                  📅 {item.release_date || 'N/A'}
                </Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.rating}>
                    ⭐ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.detailBtn}
                    onPress={() => openMovieDetails(item)}
                  >
                    <Ionicons name="play" size={12} color="#fff" />
                    <Text style={styles.detailBtnText}> Details</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.saveIcon}
                onPress={() => toggleSaveMovie(item)}
              >
                <Ionicons
                  name={isSaved(item.id) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={isSaved(item.id) ? '#E50914' : '#fff'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Complete Movie Detail Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />
          <ScrollView>
            {/* Backdrop Banner */}
            <View style={styles.backdropBox}>
              <Image
                source={{
                  uri: selectedMovie?.backdrop_path
                    ? `${BACKDROP_BASE}${selectedMovie.backdrop_path}`
                    : `${IMAGE_BASE}${selectedMovie?.poster_path}`,
                }}
                style={styles.backdropImage}
              />
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalTitle}>{selectedMovie?.title}</Text>
                <TouchableOpacity
                  onPress={() => selectedMovie && toggleSaveMovie(selectedMovie)}
                >
                  <Ionicons
                    name={
                      selectedMovie && isSaved(selectedMovie.id)
                        ? 'heart'
                        : 'heart-outline'
                    }
                    size={28}
                    color={
                      selectedMovie && isSaved(selectedMovie.id) ? '#E50914' : '#fff'
                    }
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                ⭐ {selectedMovie?.vote_average?.toFixed(1)}/10 | 📅{' '}
                {selectedMovie?.release_date}
              </Text>

              {/* YouTube Trailer Button */}
              {trailerKey && (
                <TouchableOpacity
                  style={styles.trailerBtn}
                  onPress={() =>
                    Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`)
                  }
                >
                  <Ionicons name="logo-youtube" size={20} color="#fff" />
                  <Text style={styles.trailerBtnText}> Watch Official Trailer</Text>
                </TouchableOpacity>
              )}

              {/* Overview */}
              <Text style={styles.sectionHeader}>Overview</Text>
              <Text style={styles.overviewText}>
                {selectedMovie?.overview || 'No description available.'}
              </Text>

              {detailLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#E50914"
                  style={{ marginVertical: 20 }}
                />
              ) : (
                <>
                  {/* Where to Watch (OTT Providers) */}
                  {providers.length > 0 && (
                    <View style={{ marginTop: 20 }}>
                      <Text style={styles.sectionHeader}>Where to Watch (OTT)</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 8 }}
                      >
                        {providers.map((p, idx) => (
                          <View key={idx} style={styles.providerItem}>
                            <Image
                              source={{
                                uri: `https://image.tmdb.org/t/p/w200${p.logo_path}`,
                              }}
                              style={styles.providerLogo}
                            />
                            <Text style={styles.providerName} numberOfLines={1}>
                              {p.provider_name}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Top Cast */}
                  {cast.length > 0 && (
                    <View style={{ marginTop: 20 }}>
                      <Text style={styles.sectionHeader}>Top Cast</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 8 }}
                      >
                        {cast.map((c) => (
                          <View key={c.id} style={styles.castCard}>
                            <Image
                              source={{
                                uri: c.profile_path
                                  ? `https://image.tmdb.org/t/p/w200${c.profile_path}`
                                  : 'https://via.placeholder.com/100x150/2c2c2e/ffffff?text=Actor',
                              }}
                              style={styles.castImage}
                            />
                            <Text style={styles.castName} numberOfLines={1}>
                              {c.name}
                            </Text>
                            <Text style={styles.castChar} numberOfLines={1}>
                              {c.character}
                            </Text>
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Similar Recommendations */}
                  {similar.length > 0 && (
                    <View style={{ marginTop: 20, marginBottom: 30 }}>
                      <Text style={styles.sectionHeader}>Similar Movies</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 8 }}
                      >
                        {similar.map((sim) => (
                          <TouchableOpacity
                            key={sim.id}
                            style={styles.similarCard}
                            onPress={() => openMovieDetails(sim)}
                          >
                            <Image
                              source={{
                                uri: sim.poster_path
                                  ? `${IMAGE_BASE}${sim.poster_path}`
                                  : 'https://via.placeholder.com/100x150',
                              }}
                              style={styles.similarPoster}
                            />
                            <Text style={styles.similarTitle} numberOfLines={1}>
                              {sim.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#E50914' },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1E1E1E',
  },
  tabButtonActive: { backgroundColor: '#E50914' },
  tabText: { color: '#888', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  genreList: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#222',
  },
  genrePillActive: { backgroundColor: '#E50914' },
  genreText: { color: '#999', fontSize: 13, fontWeight: '600' },
  genreTextActive: { color: '#fff' },
  movieList: { paddingHorizontal: 16, paddingBottom: 20 },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  poster: { width: 95, height: 140, borderRadius: 8 },
  movieInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  movieTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  releaseDate: { color: '#888', fontSize: 12, marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rating: { color: '#FFD700', fontSize: 13, fontWeight: 'bold' },
  cardActions: { flexDirection: 'row' },
  detailBtn: {
    backgroundColor: '#333',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  saveIcon: { position: 'absolute', top: 12, right: 12, padding: 4 },
  emptyView: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#888', fontSize: 16, marginTop: 10 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#121212' },
  backdropBox: { width: '100%', height: 220, position: 'relative' },
  backdropImage: { width: '100%', height: '100%' },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 6,
  },
  modalBody: { padding: 16 },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight:  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37, name: 'Western' }
];

export default function App() {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [currentTab, setCurrentTab] = useState('popular'); // 'popular', 'upcoming', 'top_rated', 'watchlist'
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [watchlist, setWatchlist] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Load Movies from TMDB API
  const fetchMoviesData = useCallback(async (pageNum, isFresh = false) => {
    if (currentTab === 'watchlist') return;
    if (loading) return;

    setLoading(true);
    try {
      let endpoint = '';
      
      if (searchQuery.trim().length > 0) {
        endpoint = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${pageNum}&include_adult=false&language=en-US`;
      } else if (selectedGenre !== 'all') {
        endpoint = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${selectedGenre}&sort_by=popularity.desc&page=${pageNum}&language=en-US`;
      } else if (currentTab === 'popular') {
        endpoint = `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${pageNum}&language=en-US`;
      } else if (currentTab === 'upcoming') {
        endpoint = `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&page=${pageNum}&language=en-US`;
      } else if (currentTab === 'top_rated') {
        endpoint = `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&page=${pageNum}&language=en-US`;
      }

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setMovies(prev => isFresh ? data.results : [...prev, ...data.results]);
        setPage(pageNum + 1);
        if (pageNum >= data.total_pages) {
          setHasMore(false);
        }
      } else {
        if (isFresh) setMovies([]);
        setHasMore(false);
      }
    } catch (err) {
      console.log('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTab, selectedGenre, searchQuery, loading]);

  // Trigger load when tab, genre, or search changes
  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    fetchMoviesData(1, true);
  }, [currentTab, selectedGenre, searchQuery]);

  const handleLoadMore = () => {
    if (!loading && hasMore && currentTab !== 'watchlist') {
      fetchMoviesData(page, false);
    }
  };

  const toggleWatchlist = (movie) => {
    if (watchlist.some(item => item.id === movie.id)) {
      setWatchlist(watchlist.filter(item => item.id !== movie.id));
    } else {
      setWatchlist([...watchlist, movie]);
    }
  };

  const isSaved = (id) => watchlist.some(item => item.id === id);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎬 All Movies & Trailers</Text>
      </View>

      {/* Main Tabs */}
      <View style={styles.tabContainer}>
        {['popular', 'upcoming', 'top_rated', 'watchlist'].map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.mainTab, currentTab === t && styles.activeMainTab]}
            onPress={() => {
              setSearchQuery('');
              setSelectedGenre('all');
              setCurrentTab(t);
            }}
          >
            <Text style={[styles.mainTabText, currentTab === t && styles.activeMainTabText]}>
              {t === 'popular' ? 'Popular' : t === 'upcoming' ? 'Upcoming' : t === 'top_rated' ? 'Top Rated' : `Saved (${watchlist.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {currentTab !== 'watchlist' && (
        <>
          {/* Search Box */}
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search millions of movies..."
              placeholderTextColor="#777"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
          </View>

          {/* Complete Genres Scroll */}
          <View style={styles.genreWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreScroll}>
              {ALL_GENRES.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.genreChip, selectedGenre === g.id && styles.activeGenreChip]}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedGenre(g.id);
                  }}
                >
                  <Text style={[styles.genreChipText, selectedGenre === g.id && styles.activeGenreChipText]}>
                    {g.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      {/* Movies List */}
      <FlatList
        data={currentTab === 'watchlist' ? watchlist : movies}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={{ padding: 12, paddingBottom: 60 }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator size="small" color="#E50914" style={{ marginVertical: 16 }} /> : null}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No movies found.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => { setSelectedMovie(item); setModalVisible(true); }}
            activeOpacity={0.85}
          >
            <Image
              source={{
                uri: item.poster_path
                  ? `${IMAGE_BASE}${item.poster_path}`
                  : 'https://via.placeholder.com/150x225?text=No+Poster'
              }}
              style={styles.poster}
            />
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
                <TouchableOpacity onPress={() => toggleWatchlist(item)}>
                  <Text style={{ fontSize: 18 }}>{isSaved(item.id) ? '❤️' : '🤍'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.date}>📅 {item.release_date || 'Release TBA'}</Text>
              <Text style={styles.rating}>⭐ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10</Text>
              <View style={styles.detailBtn}>
                <Text style={styles.detailBtnText}>▶ Details & Trailer</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Movie Details Modal */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {selectedMovie && (
              <>
                <Image
                  source={{
                    uri: selectedMovie.backdrop_path
                      ? `${IMAGE_BASE}${selectedMovie.backdrop_path}`
                      : `${IMAGE_BASE}${selectedMovie.poster_path}`
                  }}
                  style={styles.backdrop}
                />
                <Text style={styles.modalTitle}>{selectedMovie.title}</Text>
                <Text style={styles.modalDate}>📅 Release Date: {selectedMovie.release_date || 'TBA'}</Text>
                <Text style={styles.modalRating}>⭐ Rating: {selectedMovie.vote_average ? selectedMovie.vote_average.toFixed(1) : 'N/A'}/10</Text>

                <TouchableOpacity
                  style={styles.trailerBtn}
                  onPress={() => Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedMovie.title + ' Official Trailer')}`)}
                >
                  <Text style={styles.trailerBtnText}>▶️ Watch Official Trailer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, isSaved(selectedMovie.id) && { backgroundColor: '#333' }]}
                  onPress={() => toggleWatchlist(selectedMovie)}
                >
                  <Text style={styles.saveBtnText}>
                    {isSaved(selectedMovie.id) ? '✓ Saved in Watchlist' : '+ Add to Watchlist'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.overviewHeading}>Overview / Storyline:</Text>
                <Text style={styles.overviewText}>{selectedMovie.overview || 'Overview not available.'}</Text>

                <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeBtnText}>← Back to Movies</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f', paddingTop: 25 },
  header: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#222', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#E50914' },
  tabContainer: { flexDirection: 'row', padding: 6, backgroundColor: '#181818' },
  mainTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeMainTab: { backgroundColor: '#E50914' },
  mainTabText: { color: '#888', fontWeight: 'bold', fontSize: 11 },
  activeMainTabText: { color: '#FFF' },
  searchBox: { paddingHorizontal: 12, marginTop: 8 },
  searchInput: { backgroundColor: '#222', color: '#FFF', padding: 8, borderRadius: 8, fontSize: 13 },
  genreWrapper: { marginTop: 8, height: 38 },
  genreScroll: { paddingHorizontal: 12, alignItems: 'center' },
  genreChip: { backgroundColor: '#222', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  activeGenreChip: { backgroundColor: '#E50914' },
  genreChipText: { color: '#AAA', fontSize: 12, fontWeight: 'bold' },
  activeGenreChipText: { color: '#FFF' },
  emptyContainer: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666', fontSize: 14 },
  card: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 8, marginBottom: 10, overflow: 'hidden' },
  poster: { width: 85, height: 125, backgroundColor: '#333' },
  info: { flex: 1, padding: 10, justifyContent: 'space-between' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: 'bold', color: '#FFF', flex: 1, marginRight: 6 },
  date: { fontSize: 12, color: '#00D2D3' },
  rating: { fontSize: 12, color: '#FFD700' },
  detailBtn: { backgroundColor: '#333', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start' },
  detailBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: '#0f0f0f' },
  backdrop: { width: '100%', height: 180, borderRadius: 8, backgroundColor: '#222', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  modalDate: { fontSize: 12, color: '#00D2D3', marginBottom: 2 },
  modalRating: { fontSize: 12, color: '#FFD700', marginBottom: 12 },
  trailerBtn: { backgroundColor: '#E50914', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  trailerBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#2e7d32', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  saveBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  overviewHeading: { fontSize: 15, fontWeight: 'bold', color: '#FFF', marginBottom: 6 },
  overviewText: { fontSize: 13, color: '#CCC', lineHeight: 18, marginBottom: 20 },
  closeBtn: { backgroundColor: '#222', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});
