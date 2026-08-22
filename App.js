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

const API_KEY = '84142cf6f76c66ae978bb151e2bd8924';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// TMDB Official Complete Category List
const ALL_GENRES = [
  { id: 'all', name: '🔥 All' },
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 36, name: 'History' },
  { id: 27, name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648, name: 'Mystery' },
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
