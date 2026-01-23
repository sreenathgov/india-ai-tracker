"""
Website Scrapers - Site-Specific Implementations

Each source that requires HTML scraping has its own scraper method.
This provides better reliability than generic scraping.
"""

from scrapers.base_scraper import BaseScraper
from datetime import datetime
from urllib.parse import urljoin
import re


class WebScraper(BaseScraper):
    """Site-specific web scrapers."""

    def scrape(self, source_url, scraper_type=None):
        """
        Route to appropriate scraper based on type.

        Args:
            source_url: URL to scrape
            scraper_type: Specific scraper to use (from sources.json)

        Returns:
            List of article dicts
        """
        scrapers = {
            'india_briefing': self._scrape_india_briefing,
            'pib': self._scrape_pib,
            'aim_category': self._scrape_aim_category,
            'aim_events': self._scrape_aim_events,
            'iitm_respark': self._scrape_iitm_respark,
            'tn_gov': self._scrape_tn_gov,
            'deccan_herald': self._scrape_deccan_herald,
            'meity': self._scrape_meity,
            'niti_aayog': self._scrape_niti_aayog,
            # New scrapers
            'et_cio_events': self._scrape_et_cio_events,
            'digital_india_events': self._scrape_digital_india_events,
            'express_computer_events': self._scrape_express_computer_events,
            'karnataka_digital': self._scrape_karnataka_digital,
            'press_release_point': self._scrape_press_release_point,
            'gift_city': self._scrape_gift_city,
            'ihub_gujarat': self._scrape_ihub_gujarat,
            'up_ite': self._scrape_up_ite,
            'startinup': self._scrape_startinup,
            'startinup_events': self._scrape_startinup_events,
            'indiaai_impact': self._scrape_indiaai_impact,
            # Additional scrapers for state-specific sources
            'et_gov_tag': self._scrape_et_gov_tag,
            'et_cio_tag': self._scrape_et_cio_tag,
            'built_in_delhi': self._scrape_built_in_delhi,
            'invest_telangana': self._scrape_invest_telangana,
            'delhi_it_gov': self._scrape_delhi_it_gov,
            # New scrapers for Rajasthan, Kerala, Madhya Pradesh
            'conference_alerts': self._scrape_conference_alerts,
            'doitc_rajasthan': self._scrape_doitc_rajasthan,
            'istart_rajasthan': self._scrape_istart_rajasthan,
            'istart_events': self._scrape_istart_events,
            'kerala_it_mission': self._scrape_kerala_it_mission,
            'ksum': self._scrape_ksum,
            'prd_kerala': self._scrape_prd_kerala,
            'mp_info': self._scrape_mp_info,
            'invest_mp': self._scrape_invest_mp,
            # Northeast state scrapers
            'arunachal_ditc': self._scrape_arunachal_ditc,
            'nic_news': self._scrape_nic_news,
            'nic_events': self._scrape_nic_events,
            'tripura_times': self._scrape_tripura_times,
            'tripura_chronicle': self._scrape_tripura_chronicle,
            'startup_assam': self._scrape_startup_assam,
            'startup_manipur': self._scrape_startup_manipur,
            'meghalaya_gov': self._scrape_meghalaya_gov,
            'prime_meghalaya': self._scrape_prime_meghalaya,
            'invest_meghalaya': self._scrape_invest_meghalaya,
            'dict_mizoram': self._scrape_dict_mizoram,
            'startup_mizoram': self._scrape_startup_mizoram,
            'startup_nagaland': self._scrape_startup_nagaland,
            # New scrapers for Ladakh, J&K, Jharkhand, HP, UK, WB, Odisha, Bihar, CG, and All-India
            'ladakh_gov': self._scrape_ladakh_gov,
            'voice_of_ladakh': self._scrape_voice_of_ladakh,
            'uol_events': self._scrape_uol_events,
            'greater_kashmir': self._scrape_greater_kashmir,
            'jharkhand_gov_events': self._scrape_jharkhand_gov_events,
            'knowafest': self._scrape_knowafest,
            'allconferencealert': self._scrape_allconferencealert,
            'startup_uttarakhand': self._scrape_startup_uttarakhand,
            'webel_events': self._scrape_webel_events,
            'bengal_chamber': self._scrape_bengal_chamber,
            'odisha_gov': self._scrape_odisha_gov,
            'odisha_it': self._scrape_odisha_it,
            'bihar_egazette': self._scrape_bihar_egazette,
            'bihar_tech': self._scrape_bihar_tech,
            'chips_cg': self._scrape_chips_cg,
            'techcircle': self._scrape_techcircle,
            'cellit': self._scrape_cellit,
            'nenews': self._scrape_nenews,
            'indiatodayne': self._scrape_indiatodayne,
            'tamilnadu_tech': self._scrape_tamilnadu_tech,
            # Punjab, Goa, Haryana scrapers
            'startup_goa': self._scrape_startup_goa,
            'goa_dit': self._scrape_goa_dit,
            'haryana_it': self._scrape_haryana_it,
            'startup_haryana': self._scrape_startup_haryana,
        }

        if scraper_type and scraper_type in scrapers:
            return scrapers[scraper_type](source_url)
        else:
            return self._scrape_generic(source_url)

    def _scrape_india_briefing(self, url):
        """Scrape India Briefing news articles."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # India Briefing uses WordPress card layout
            article_cards = soup.find_all('article') or soup.find_all('div', class_=re.compile(r'post|article'))

            for card in article_cards[:15]:
                try:
                    # Find title and link
                    title_elem = card.find(['h2', 'h3', 'h4'])
                    link_elem = card.find('a', href=True)

                    if not title_elem or not link_elem:
                        continue

                    title = self.extract_text(title_elem)
                    link = urljoin(url, link_elem['href'])

                    # Find date
                    date_elem = card.find(['time', 'span'], class_=re.compile(r'date|time'))
                    date_published = self._parse_date_text(date_elem.text if date_elem else '')

                    # Find excerpt/summary
                    excerpt_elem = card.find(['p', 'div'], class_=re.compile(r'excerpt|summary|desc'))
                    content = self.extract_text(excerpt_elem) if excerpt_elem else ''

                    if title and link:
                        articles.append({
                            'title': title,
                            'url': link,
                            'content': content,
                            'date_published': date_published,
                            'source_url': url
                        })
                except Exception as e:
                    continue

            print(f"  Scraped {len(articles)} articles from India Briefing")
            return articles

        except Exception as e:
            print(f"  Error scraping India Briefing: {e}")
            return []

    def _scrape_pib(self, url):
        """Scrape PIB (Press Information Bureau) releases."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # PIB uses ul/li structure with links
            release_links = soup.find_all('a', href=re.compile(r'PressReleasePage\.aspx\?PRID='))

            for link in release_links[:20]:
                try:
                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin('https://www.pib.gov.in/', href)

                    if title and full_url:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': title,  # PIB titles are usually descriptive
                            'date_published': datetime.now().date(),
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} releases from PIB")
            return articles

        except Exception as e:
            print(f"  Error scraping PIB: {e}")
            return []

    def _scrape_aim_category(self, url):
        """Scrape Analytics India Magazine category pages."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # AIM uses Elementor with article/post containers
            post_containers = soup.find_all(['article', 'div'], class_=re.compile(r'elementor-post|post-'))

            for container in post_containers[:15]:
                try:
                    # Find title link
                    title_link = container.find('a', class_=re.compile(r'elementor-post__title|entry-title'))
                    if not title_link:
                        title_link = container.find('h3')
                        if title_link:
                            title_link = title_link.find('a')

                    if not title_link:
                        continue

                    title = self.extract_text(title_link)
                    link = title_link.get('href', '')

                    # Find excerpt
                    excerpt = container.find(['div', 'p'], class_=re.compile(r'excerpt|summary'))
                    content = self.extract_text(excerpt) if excerpt else ''

                    # Find date
                    date_elem = container.find(['span', 'time'], class_=re.compile(r'date|meta'))
                    date_published = self._parse_date_text(date_elem.text if date_elem else '')

                    if title and link:
                        articles.append({
                            'title': title,
                            'url': link,
                            'content': content,
                            'date_published': date_published,
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from AIM")
            return articles

        except Exception as e:
            print(f"  Error scraping AIM: {e}")
            return []

    def _scrape_aim_events(self, url):
        """Scrape Analytics India Magazine events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # AIM events use card layout with image and text
            event_cards = soup.find_all('div', class_=re.compile(r'elementor-widget'))

            for card in event_cards[:10]:
                try:
                    # Find event title/link
                    link = card.find('a', href=True)
                    if not link:
                        continue

                    href = link.get('href', '')
                    if not href or 'event' not in href.lower() and 'conference' not in href.lower():
                        # Skip non-event links
                        continue

                    # Get title from heading or link text
                    title_elem = card.find(['h2', 'h3', 'h4', 'h5'])
                    title = self.extract_text(title_elem) if title_elem else self.extract_text(link)

                    # Look for date/location info
                    text_content = card.get_text(separator=' ', strip=True)

                    if title and href:
                        articles.append({
                            'title': title,
                            'url': href,
                            'content': text_content[:500],
                            'date_published': datetime.now().date(),
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from AIM")
            return articles

        except Exception as e:
            print(f"  Error scraping AIM events: {e}")
            return []

    def _scrape_iitm_respark(self, url):
        """Scrape IIT Madras Research Park newsroom."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # IITM uses .news-card containers
            news_cards = soup.find_all(['div', 'article'], class_=re.compile(r'news-card|card'))

            for card in news_cards[:15]:
                try:
                    # Find title and link
                    title_elem = card.find(['h3', 'h4', 'a'], class_=re.compile(r'card-title|title'))
                    link_elem = card.find('a', href=True)

                    if not link_elem:
                        continue

                    title = self.extract_text(title_elem) if title_elem else self.extract_text(link_elem)
                    href = link_elem.get('href', '')
                    full_url = urljoin(url, href)

                    # Find description
                    desc_elem = card.find(['p', 'div'], class_=re.compile(r'desc|excerpt|summary'))
                    content = self.extract_text(desc_elem) if desc_elem else ''

                    # Find date
                    date_elem = card.find(['span', 'time'], class_=re.compile(r'date|meta'))
                    date_published = self._parse_date_text(date_elem.text if date_elem else '')

                    if title and full_url:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': content,
                            'date_published': date_published,
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from IITM Research Park")
            return articles

        except Exception as e:
            print(f"  Error scraping IITM Research Park: {e}")
            return []

    def _scrape_tn_gov(self, url):
        """Scrape Tamil Nadu Government press releases."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # TN Gov uses ul/li structure
            release_items = soup.find_all('li')

            for item in release_items[:20]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    # Look for date
                    date_text = item.get_text()
                    date_published = self._parse_date_text(date_text)

                    if title and len(title) > 10:  # Filter out very short items
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': title,
                            'date_published': date_published,
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} releases from TN Gov")
            return articles

        except Exception as e:
            print(f"  Error scraping TN Gov: {e}")
            return []

    def _scrape_generic(self, url):
        """Generic scraper for unspecified sources."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Try common article patterns
            article_elements = soup.find_all(['article', 'div'], class_=re.compile(r'article|post|story|card'))

            for element in article_elements[:15]:
                try:
                    title_elem = element.find(['h1', 'h2', 'h3', 'a'])
                    link_elem = element.find('a', href=True)

                    if title_elem and link_elem:
                        title = self.extract_text(title_elem)
                        link = urljoin(url, link_elem.get('href', ''))
                        content = self.extract_text(element)[:500]

                        articles.append({
                            'title': title,
                            'url': link,
                            'content': content,
                            'date_published': datetime.now().date(),
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles (generic scraper)")
            return articles

        except Exception as e:
            print(f"  Error in generic scraper: {e}")
            return []

    def _scrape_deccan_herald(self, url):
        """Scrape Deccan Herald Karnataka section."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Deccan Herald uses article cards with structure:
            # - Image on right, text on left
            # - Title in h3/a, summary in p, timestamp in span
            article_containers = soup.find_all(['article', 'div'], class_=re.compile(r'story|card|article|news-item'))

            for container in article_containers[:20]:
                try:
                    # Find title - usually in h2, h3, or a tag with class containing 'title'
                    title_elem = container.find(['h2', 'h3', 'h4'])
                    if not title_elem:
                        title_elem = container.find('a', class_=re.compile(r'title|headline'))

                    if not title_elem:
                        continue

                    # Get link
                    link_elem = title_elem.find('a') if title_elem.name != 'a' else title_elem
                    if not link_elem:
                        link_elem = container.find('a', href=True)

                    if not link_elem:
                        continue

                    title = self.extract_text(title_elem)
                    href = link_elem.get('href', '')
                    full_url = urljoin(url, href)

                    # Skip non-article links
                    if not href or '/photo/' in href or '/video/' in href:
                        continue

                    # Find summary/excerpt
                    summary_elem = container.find(['p', 'div'], class_=re.compile(r'excerpt|summary|desc|intro'))
                    if not summary_elem:
                        summary_elem = container.find('p')
                    content = self.extract_text(summary_elem) if summary_elem else ''

                    # Find date - look for time element or span with date-like content
                    date_elem = container.find(['time', 'span'], class_=re.compile(r'date|time|ago|published'))
                    date_published = self._parse_date_text(date_elem.text if date_elem else '')

                    if title and full_url and len(title) > 10:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': content,
                            'date_published': date_published,
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from Deccan Herald")
            return articles

        except Exception as e:
            print(f"  Error scraping Deccan Herald: {e}")
            return []

    def _scrape_meity(self, url):
        """Scrape MeitY (Ministry of Electronics and IT) press releases."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # MeitY uses Drupal CMS with table or list structure
            # Look for press release rows in tables
            table_rows = soup.find_all('tr')

            for row in table_rows[:30]:
                try:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) < 2:
                        continue

                    # Find link in cells
                    link_elem = row.find('a', href=True)
                    if not link_elem:
                        continue

                    title = self.extract_text(link_elem)
                    href = link_elem.get('href', '')
                    full_url = urljoin(url, href)

                    # Skip navigation/header links
                    if not title or len(title) < 10:
                        continue

                    # Look for date in cells
                    date_published = datetime.now().date()
                    for cell in cells:
                        cell_text = cell.get_text(strip=True)
                        # Look for date patterns
                        if re.search(r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}', cell_text):
                            date_published = self._parse_date_text(cell_text)
                            break
                        elif re.search(r'\d{1,2}\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)', cell_text, re.I):
                            date_published = self._parse_date_text(cell_text)
                            break

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Also try list-based structure (ul/li)
            if not articles:
                list_items = soup.find_all('li', class_=re.compile(r'views-row|item'))
                for item in list_items[:30]:
                    try:
                        link_elem = item.find('a', href=True)
                        if not link_elem:
                            continue

                        title = self.extract_text(link_elem)
                        href = link_elem.get('href', '')
                        full_url = urljoin(url, href)

                        if title and len(title) > 10:
                            date_text = item.get_text()
                            date_published = self._parse_date_text(date_text)

                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': date_published,
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} releases from MeitY")
            return articles

        except Exception as e:
            print(f"  Error scraping MeitY: {e}")
            return []

    def _scrape_niti_aayog(self, url):
        """Scrape NITI Aayog publications/reports."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # NITI Aayog uses table layout with columns:
            # S.No | Title | Date | Division | Download (PDF link)
            table_rows = soup.find_all('tr')

            for row in table_rows[:30]:
                try:
                    cells = row.find_all(['td', 'th'])
                    if len(cells) < 4:
                        continue

                    # Skip header row
                    if cells[0].find('th') or cells[0].get_text(strip=True) == 'S. No.':
                        continue

                    # Cell 1 = Title, Cell 2 = Date, Cell 4 = Download link
                    title = cells[1].get_text(strip=True) if len(cells) > 1 else ''
                    date_text = cells[2].get_text(strip=True) if len(cells) > 2 else ''

                    # Get PDF download link from last cell
                    link_elem = cells[-1].find('a', href=True) if cells else None
                    if not link_elem:
                        # Try finding any link in the row
                        link_elem = row.find('a', href=True)

                    if not link_elem or not title or len(title) < 5:
                        continue

                    href = link_elem.get('href', '')
                    full_url = urljoin(url, href)

                    # Parse date (format: "January, 2026")
                    date_published = self._parse_date_text(date_text)

                    # Get division info as content
                    division = cells[3].get_text(strip=True) if len(cells) > 3 else ''
                    content = f"{title}. Division: {division}" if division else title

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': content,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} reports from NITI Aayog")
            return articles

        except Exception as e:
            print(f"  Error scraping NITI Aayog: {e}")
            return []

    def _parse_date_text(self, date_text):
        """Parse date from text."""
        if not date_text:
            return datetime.now().date()

        months = {
            'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
            'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
        }

        date_text_lower = date_text.lower()

        # Try "Month, Year" format first (e.g., "January, 2026")
        month_year_match = re.search(r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*,?\s+(\d{4})', date_text_lower)
        if month_year_match:
            try:
                month_str, year = month_year_match.groups()
                return datetime(int(year), months[month_str[:3]], 1).date()
            except Exception:
                pass

        # Common date patterns with day
        patterns = [
            (r'(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{4})', 'dmy'),
            (r'(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+(\d{1,2}),?\s+(\d{4})', 'mdy'),
            (r'(\d{4})-(\d{2})-(\d{2})', 'ymd'),
            (r'(\d{1,2})/(\d{1,2})/(\d{4})', 'dmy_slash'),
        ]

        for pattern, fmt in patterns:
            match = re.search(pattern, date_text_lower, re.IGNORECASE)
            if match:
                try:
                    groups = match.groups()
                    if fmt == 'dmy':  # "15 Jan 2024"
                        day, month_str, year = groups
                        return datetime(int(year), months[month_str[:3]], int(day)).date()
                    elif fmt == 'mdy':  # "Jan 15, 2024"
                        month_str, day, year = groups
                        return datetime(int(year), months[month_str[:3]], int(day)).date()
                    elif fmt == 'ymd':  # "2024-01-15"
                        year, month, day = groups
                        return datetime(int(year), int(month), int(day)).date()
                    elif fmt == 'dmy_slash':  # "15/01/2024"
                        day, month, year = groups
                        return datetime(int(year), int(month), int(day)).date()
                except Exception:
                    pass

        return datetime.now().date()

    # ==================== NEW SCRAPERS ====================

    def _scrape_et_cio_events(self, url):
        """Scrape ET CIO Events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # ET CIO uses event_story_item class for event cards
            items = soup.find_all(class_='event_story_item')

            for item in items[:20]:
                try:
                    # Get title from heading
                    title_el = item.find(['h2', 'h3', 'h4', 'strong'])
                    title = self.extract_text(title_el) if title_el else ''

                    # Get link
                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    # Get text for date and location extraction
                    text = item.get_text(separator=' ', strip=True)

                    # Parse date
                    date_match = re.search(r'(\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4})', text)
                    date_published = self._parse_date_text(date_match.group(1) if date_match else '')

                    # Extract location from text
                    location = ''
                    loc_match = re.search(r'(mumbai|delhi|bangalore|bengaluru|hyderabad|chennai|pune|kolkata|virtual|online)', text.lower())
                    if loc_match:
                        location = loc_match.group(1).title()

                    if title and full_url:
                        content = f"{title}. Location: {location}" if location else title
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': content,
                            'date_published': date_published,
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from ET CIO")
            return articles

        except Exception as e:
            print(f"  Error scraping ET CIO Events: {e}")
            return []

    def _scrape_digital_india_events(self, url):
        """Scrape Digital India Events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Digital India uses ph_vd_ev_card class for event cards
            cards = soup.find_all(class_='ph_vd_ev_card')

            for card in cards[:20]:
                try:
                    # Get title from card-title
                    title_el = card.find(class_='card-title')
                    title = self.extract_text(title_el) if title_el else ''

                    # Get link
                    link = card.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if title and full_url:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': title,
                            'date_published': datetime.now().date(),
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from Digital India")
            return articles

        except Exception as e:
            print(f"  Error scraping Digital India Events: {e}")
            return []

    def _scrape_express_computer_events(self, url):
        """Scrape Express Computer Events (The Events Calendar plugin)."""
        try:
            # Use list view for better structure
            list_url = url.rstrip('/') + '/list/' if not url.endswith('/list/') else url
            response = self.fetch_url(list_url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # The Events Calendar uses tribe-events-calendar-list__event
            events = soup.find_all(class_='tribe-events-calendar-list__event')

            for event in events[:20]:
                try:
                    # Get title
                    title_el = event.find(class_=lambda x: x and 'title' in str(x).lower())
                    if not title_el:
                        title_el = event.find('h3')
                    title = self.extract_text(title_el) if title_el else ''

                    # Get link
                    link = event.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    # Get date
                    date_el = event.find(class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    # Get venue/location
                    venue_el = event.find(class_=lambda x: x and 'venue' in str(x).lower())
                    venue = self.extract_text(venue_el) if venue_el else ''

                    if title and full_url:
                        content = f"{title}. Venue: {venue}" if venue else title
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': content,
                            'date_published': date_published,
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from Express Computer")
            return articles

        except Exception as e:
            print(f"  Error scraping Express Computer Events: {e}")
            return []

    def _scrape_karnataka_digital(self, url):
        """Scrape Karnataka Digital (KDEM) pages - events, policies, newsletter."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # For events page - uses Modern Events Calendar (MEC) plugin
            if '/events' in url:
                events = soup.find_all('article', class_='mec-event-article')
                for event in events[:20]:
                    try:
                        # Get link (contains title in href text)
                        link = event.find('a', href=True)
                        href = link.get('href', '') if link else ''

                        # Get title from link or h4
                        title_el = event.find(['h4', 'h3', 'h2'])
                        if title_el:
                            title = self.extract_text(title_el)
                        else:
                            # Extract from URL
                            title = href.split('/')[-2].replace('-', ' ').title() if href else ''

                        # Get date
                        date_el = event.find(class_=lambda x: x and 'date' in str(x).lower())
                        date_text = date_el.get_text(strip=True) if date_el else ''
                        date_published = self._parse_date_text(date_text)

                        if title and href:
                            articles.append({
                                'title': title,
                                'url': href,
                                'content': title,
                                'date_published': date_published,
                                'source_url': url
                            })
                    except Exception:
                        continue

            # For policies/newsletter pages - look for PDF links and content
            else:
                # Look for card elements or list items
                content_items = soup.find_all(['article', 'div'], class_=lambda x: x and ('card' in str(x).lower() or 'item' in str(x).lower() or 'post' in str(x).lower()))

                if not content_items:
                    # Fall back to links
                    content_items = soup.find_all('a', href=lambda x: x and ('.pdf' in x.lower() or '/policy' in x.lower() or '/newsletter' in x.lower()))

                for item in content_items[:20]:
                    try:
                        if item.name == 'a':
                            title = self.extract_text(item)
                            href = item.get('href', '')
                        else:
                            title_el = item.find(['h2', 'h3', 'h4', 'a'])
                            title = self.extract_text(title_el) if title_el else ''
                            link = item.find('a', href=True)
                            href = link.get('href', '') if link else ''

                        full_url = urljoin(url, href)

                        if title and full_url and len(title) > 5:
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} items from Karnataka Digital")
            return articles

        except Exception as e:
            print(f"  Error scraping Karnataka Digital: {e}")
            return []

    def _scrape_press_release_point(self, url):
        """Scrape PressReleasePoint for press releases."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for press release items
            items = soup.find_all(['article', 'div', 'li'], class_=lambda x: x and ('press' in str(x).lower() or 'release' in str(x).lower() or 'item' in str(x).lower() or 'card' in str(x).lower()))

            if not items:
                # Try generic structure
                items = soup.find_all('a', href=lambda x: x and '/press-release/' in x)

            for item in items[:20]:
                try:
                    if item.name == 'a':
                        title = self.extract_text(item)
                        href = item.get('href', '')
                    else:
                        title_el = item.find(['h2', 'h3', 'h4', 'a'])
                        title = self.extract_text(title_el) if title_el else ''
                        link = item.find('a', href=True)
                        href = link.get('href', '') if link else ''

                    full_url = urljoin(url, href)

                    if title and full_url and len(title) > 10:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': title,
                            'date_published': datetime.now().date(),
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} releases from PressReleasePoint")
            return articles

        except Exception as e:
            print(f"  Error scraping PressReleasePoint: {e}")
            return []

    def _scrape_gift_city(self, url):
        """Scrape GIFT City Gujarat news."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for news cards or list items
            items = soup.find_all(['article', 'div', 'li'], class_=lambda x: x and ('news' in str(x).lower() or 'card' in str(x).lower() or 'item' in str(x).lower() or 'update' in str(x).lower()))

            for item in items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    # Get date if available
                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    if title and full_url and len(title) > 10:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': title,
                            'date_published': date_published,
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} items from GIFT City")
            return articles

        except Exception as e:
            print(f"  Error scraping GIFT City: {e}")
            return []

    def _scrape_ihub_gujarat(self, url):
        """Scrape iHub Gujarat events."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for event cards
            events = soup.find_all(['article', 'div'], class_=lambda x: x and ('event' in str(x).lower() or 'card' in str(x).lower()))

            for event in events[:20]:
                try:
                    title_el = event.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = event.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if title and full_url and len(title) > 5:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': title,
                            'date_published': datetime.now().date(),
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from iHub Gujarat")
            return articles

        except Exception as e:
            print(f"  Error scraping iHub Gujarat: {e}")
            return []

    def _scrape_up_ite(self, url):
        """Scrape UP IT & Electronics Department news."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for news items - government sites often use tables or lists
            items = soup.find_all(['tr', 'li', 'div'], class_=lambda x: x and ('news' in str(x).lower() or 'announcement' in str(x).lower() or 'item' in str(x).lower()))

            if not items:
                # Try table rows
                items = soup.find_all('tr')

            for item in items[:30]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    # Skip very short titles or navigation links
                    if not title or len(title) < 10:
                        continue

                    # Look for date
                    date_el = item.find(['td', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = item.get_text() if not date_el else date_el.get_text()
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} items from UP ITE")
            return articles

        except Exception as e:
            print(f"  Error scraping UP ITE: {e}")
            return []

    def _scrape_startinup(self, url):
        """Scrape StartInUP (UP Startup Portal) policies and news."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for policy cards or content items
            items = soup.find_all(['article', 'div'], class_=lambda x: x and ('policy' in str(x).lower() or 'card' in str(x).lower() or 'item' in str(x).lower() or 'content' in str(x).lower()))

            # Also look for PDF links (policies are often PDFs)
            pdf_links = soup.find_all('a', href=lambda x: x and '.pdf' in x.lower())

            # Combine both
            for item in items[:15]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if title and full_url and len(title) > 10:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': title,
                            'date_published': datetime.now().date(),
                            'source_url': url
                        })
                except Exception:
                    continue

            for pdf_link in pdf_links[:10]:
                try:
                    title = self.extract_text(pdf_link) or pdf_link.get('href', '').split('/')[-1].replace('.pdf', '').replace('-', ' ').title()
                    href = pdf_link.get('href', '')
                    full_url = urljoin(url, href)

                    if title and full_url and len(title) > 5:
                        # Avoid duplicates
                        if not any(a['url'] == full_url for a in articles):
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} items from StartInUP")
            return articles

        except Exception as e:
            print(f"  Error scraping StartInUP: {e}")
            return []

    def _scrape_startinup_events(self, url):
        """Scrape StartInUP events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for event cards
            events = soup.find_all(['article', 'div'], class_=lambda x: x and ('event' in str(x).lower() or 'card' in str(x).lower() or 'upcoming' in str(x).lower()))

            for event in events[:20]:
                try:
                    title_el = event.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = event.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    # Look for date
                    date_el = event.find(['time', 'span', 'div'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    if title and full_url and len(title) > 5:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': title,
                            'date_published': date_published,
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from StartInUP")
            return articles

        except Exception as e:
            print(f"  Error scraping StartInUP events: {e}")
            return []

    def _scrape_indiaai_impact(self, url):
        """Scrape IndiaAI Impact media resources page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for card elements
            cards = soup.find_all(['article', 'div'], class_=lambda x: x and ('card' in str(x).lower() or 'item' in str(x).lower() or 'press' in str(x).lower() or 'media' in str(x).lower()))

            for card in cards[:20]:
                try:
                    title_el = card.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = card.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if title and full_url and len(title) > 10:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': title,
                            'date_published': datetime.now().date(),
                            'source_url': url
                        })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} items from IndiaAI Impact")
            return articles

        except Exception as e:
            print(f"  Error scraping IndiaAI Impact: {e}")
            return []

    def _scrape_et_gov_tag(self, url):
        """Scrape ET Government tag pages (Maharashtra, Delhi, etc)."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # ET Government uses article listing with class containing 'story' or 'data'
            story_items = soup.find_all(['div', 'article'], class_=lambda x: x and ('story' in str(x).lower() or 'data' in str(x).lower() or 'listing' in str(x).lower()))

            for item in story_items[:20]:
                try:
                    # Find title
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    # Find link
                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    # Skip navigation/empty links
                    if not title or len(title) < 15:
                        continue

                    # Get date if available
                    date_el = item.find(['time', 'span'], class_=lambda x: x and ('date' in str(x).lower() or 'time' in str(x).lower()))
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    # Get excerpt/summary
                    excerpt_el = item.find(['p', 'div'], class_=lambda x: x and ('synopsis' in str(x).lower() or 'desc' in str(x).lower() or 'excerpt' in str(x).lower()))
                    content = self.extract_text(excerpt_el) if excerpt_el else title

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': content,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from ET Government tag page")
            return articles

        except Exception as e:
            print(f"  Error scraping ET Government tag: {e}")
            return []

    def _scrape_et_cio_tag(self, url):
        """Scrape ET CIO tag pages (Delhi, Hyderabad, etc)."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Similar structure to ET Government
            story_items = soup.find_all(['div', 'article'], class_=lambda x: x and ('story' in str(x).lower() or 'data' in str(x).lower() or 'listing' in str(x).lower()))

            for item in story_items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if not title or len(title) < 15:
                        continue

                    date_el = item.find(['time', 'span'], class_=lambda x: x and ('date' in str(x).lower() or 'time' in str(x).lower()))
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from ET CIO tag page")
            return articles

        except Exception as e:
            print(f"  Error scraping ET CIO tag: {e}")
            return []

    def _scrape_built_in_delhi(self, url):
        """Scrape Built in Delhi articles page."""
        try:
            # Always use the articles page
            articles_url = url.rstrip('/') + '/articles' if not url.endswith('/articles') else url
            response = self.fetch_url(articles_url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Find article links
            article_links = soup.find_all('a', href=lambda x: x and '/articles/' in str(x) and x != '/articles')

            seen_urls = set()
            for link in article_links[:30]:
                try:
                    href = link.get('href', '')
                    if href in seen_urls or href == '/articles':
                        continue
                    seen_urls.add(href)

                    # Get title from link text or nearby heading
                    title = link.get_text(strip=True)
                    if not title or len(title) < 10:
                        parent = link.parent
                        title_el = parent.find(['h2', 'h3', 'h4']) if parent else None
                        title = self.extract_text(title_el) if title_el else ''

                    if not title or len(title) < 10:
                        continue

                    full_url = urljoin(articles_url, href)

                    # Try to extract date from URL (format: title-YYYYMMDD)
                    date_match = re.search(r'-(\d{8})$', href)
                    if date_match:
                        try:
                            date_str = date_match.group(1)
                            date_published = datetime.strptime(date_str, '%Y%m%d').date()
                        except:
                            date_published = datetime.now().date()
                    else:
                        date_published = datetime.now().date()

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from Built in Delhi")
            return articles

        except Exception as e:
            print(f"  Error scraping Built in Delhi: {e}")
            return []

    def _scrape_invest_telangana(self, url):
        """Scrape Invest Telangana emerging technologies page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Find content cards/sections about tech sectors
            content_divs = soup.find_all(['div', 'section', 'article'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['sector', 'content', 'card', 'item', 'tech', 'feature']))

            for div in content_divs[:20]:
                try:
                    title_el = div.find(['h2', 'h3', 'h4', 'h5'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = div.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href) if href else url

                    # Get description
                    desc_el = div.find(['p', 'div'], class_=lambda x: not x or 'title' not in str(x).lower())
                    content = self.extract_text(desc_el) if desc_el else title

                    if title and len(title) > 5:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': content[:500] if content else title,
                            'date_published': datetime.now().date(),
                            'source_url': url
                        })
                except Exception:
                    continue

            # Also look for any PDF links (policies often in PDFs)
            pdf_links = soup.find_all('a', href=lambda x: x and '.pdf' in x.lower())
            for pdf_link in pdf_links[:10]:
                try:
                    title = self.extract_text(pdf_link) or pdf_link.get('href', '').split('/')[-1].replace('.pdf', '').replace('-', ' ').title()
                    href = pdf_link.get('href', '')
                    full_url = urljoin(url, href)

                    if title and len(title) > 5:
                        if not any(a['url'] == full_url for a in articles):
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} items from Invest Telangana")
            return articles

        except Exception as e:
            print(f"  Error scraping Invest Telangana: {e}")
            return []

    def _scrape_delhi_it_gov(self, url):
        """Scrape Delhi IT Government publications page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for document/publication links
            doc_links = soup.find_all('a', href=lambda x: x and ('/sites/default/files' in str(x) or '.pdf' in str(x).lower() or '/document' in str(x).lower()))

            for link in doc_links[:20]:
                try:
                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    # Skip very short titles or navigation
                    if not title or len(title) < 5:
                        # Try to get title from filename
                        title = href.split('/')[-1].replace('.pdf', '').replace('-', ' ').replace('_', ' ').title()

                    if title and full_url and len(title) > 5:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': title,
                            'date_published': datetime.now().date(),
                            'source_url': url
                        })
                except Exception:
                    continue

            # Also look for list items with links
            list_items = soup.find_all('li', class_=lambda x: x and ('view' in str(x).lower() or 'item' in str(x).lower()))
            for item in list_items[:15]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link) or self.extract_text(item)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if title and full_url and len(title) > 10:
                        # Avoid duplicates
                        if not any(a['url'] == full_url for a in articles):
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} publications from Delhi IT Gov")
            return articles

        except Exception as e:
            print(f"  Error scraping Delhi IT Gov: {e}")
            return []

    # ==================== NEW SCRAPERS FOR RAJASTHAN, KERALA, MP ====================

    def _scrape_conference_alerts(self, url):
        """Scrape Conference Alerts India for AI conferences."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Conference Alerts uses table or card layout for events
            # Look for conference entries
            conf_items = soup.find_all(['div', 'article', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['conf', 'event', 'listing', 'item', 'row']))

            # Also try table rows directly
            if not conf_items:
                conf_items = soup.find_all('tr')

            for item in conf_items[:30]:
                try:
                    # Find title/name of conference
                    title_el = item.find(['h2', 'h3', 'h4', 'a', 'td'])
                    if not title_el:
                        continue

                    # Get link
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(title_el) if title_el.name != 'a' else self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    # Skip navigation/very short titles
                    if not title or len(title) < 10:
                        continue

                    # Look for date
                    text = item.get_text(separator=' ', strip=True)
                    date_match = re.search(r'(\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4})', text)
                    date_published = self._parse_date_text(date_match.group(1) if date_match else '')

                    # Look for location
                    location = ''
                    loc_patterns = [
                        r'(jaipur|delhi|mumbai|bangalore|bengaluru|hyderabad|chennai|kolkata|pune|ahmedabad|kochi|lucknow|bhopal|indore)',
                        r'(india|virtual|online|hybrid)'
                    ]
                    for pattern in loc_patterns:
                        loc_match = re.search(pattern, text.lower())
                        if loc_match:
                            location = loc_match.group(1).title()
                            break

                    content = f"{title}. Location: {location}" if location else title

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': content,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} conferences from Conference Alerts")
            return articles

        except Exception as e:
            print(f"  Error scraping Conference Alerts: {e}")
            return []

    def _scrape_doitc_rajasthan(self, url):
        """Scrape Rajasthan DoITC (Dept of IT & Communication) news."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Government sites often use table structure
            table_rows = soup.find_all('tr')

            for row in table_rows[:30]:
                try:
                    link = row.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    # Skip navigation/short titles
                    if not title or len(title) < 10:
                        continue

                    # Look for date in row cells
                    cells = row.find_all('td')
                    date_published = datetime.now().date()
                    for cell in cells:
                        cell_text = cell.get_text(strip=True)
                        if re.search(r'\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}', cell_text):
                            date_published = self._parse_date_text(cell_text)
                            break

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Also try list items if table didn't work
            if not articles:
                list_items = soup.find_all('li')
                for item in list_items[:30]:
                    try:
                        link = item.find('a', href=True)
                        if not link:
                            continue

                        title = self.extract_text(link)
                        href = link.get('href', '')
                        full_url = urljoin(url, href)

                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} items from DoITC Rajasthan")
            return articles

        except Exception as e:
            print(f"  Error scraping DoITC Rajasthan: {e}")
            return []

    def _scrape_istart_rajasthan(self, url):
        """Scrape iStart Rajasthan news page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for news cards or articles
            news_items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['news', 'card', 'item', 'post', 'article']))

            for item in news_items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Get date
                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    # Get excerpt
                    excerpt_el = item.find(['p', 'div'], class_=lambda x: x and ('excerpt' in str(x).lower() or 'desc' in str(x).lower()))
                    content = self.extract_text(excerpt_el) if excerpt_el else title

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': content,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} news from iStart Rajasthan")
            return articles

        except Exception as e:
            print(f"  Error scraping iStart Rajasthan: {e}")
            return []

    def _scrape_istart_events(self, url):
        """Scrape iStart Rajasthan events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for event cards
            event_items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['event', 'card', 'item', 'workshop', 'hackathon']))

            for item in event_items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if not title or len(title) < 5:
                        continue

                    # Get date
                    date_el = item.find(['time', 'span', 'div'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    # Get venue
                    venue_el = item.find(['span', 'div'], class_=lambda x: x and ('venue' in str(x).lower() or 'location' in str(x).lower()))
                    venue = self.extract_text(venue_el) if venue_el else ''
                    content = f"{title}. Venue: {venue}" if venue else title

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': content,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from iStart Rajasthan")
            return articles

        except Exception as e:
            print(f"  Error scraping iStart events: {e}")
            return []

    def _scrape_kerala_it_mission(self, url):
        """Scrape Kerala IT Mission news page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # WordPress category page structure
            post_items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['post', 'article', 'news', 'entry', 'item']))

            for item in post_items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4'])
                    if not title_el:
                        continue

                    # Get link from title or inside item
                    link = title_el.find('a', href=True) or item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(title_el)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Get date
                    date_el = item.find(['time', 'span'], class_=lambda x: x and ('date' in str(x).lower() or 'posted' in str(x).lower()))
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    # Get excerpt
                    excerpt_el = item.find(['p', 'div'], class_=lambda x: x and ('excerpt' in str(x).lower() or 'content' in str(x).lower()))
                    content = self.extract_text(excerpt_el) if excerpt_el else title

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': content[:500] if content else title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} news from Kerala IT Mission")
            return articles

        except Exception as e:
            print(f"  Error scraping Kerala IT Mission: {e}")
            return []

    def _scrape_ksum(self, url):
        """Scrape Kerala Startup Mission (KSUM) news page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for news cards/items
            news_items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['news', 'card', 'item', 'post', 'story']))

            for item in news_items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Get date
                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Also look for direct news links
            if not articles:
                news_links = soup.find_all('a', href=lambda x: x and '/news/' in str(x))
                seen_urls = set()
                for link in news_links[:20]:
                    try:
                        href = link.get('href', '')
                        if href in seen_urls:
                            continue
                        seen_urls.add(href)

                        title = self.extract_text(link)
                        full_url = urljoin(url, href)

                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} news from KSUM")
            return articles

        except Exception as e:
            print(f"  Error scraping KSUM: {e}")
            return []

    def _scrape_prd_kerala(self, url):
        """Scrape PRD Live Kerala (Public Relations Dept) news."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Government news portal - look for news items
            news_items = soup.find_all(['article', 'div', 'li'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['news', 'item', 'card', 'release', 'story']))

            for item in news_items[:25]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Get date
                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Also try table rows (common in govt sites)
            if not articles:
                table_rows = soup.find_all('tr')
                for row in table_rows[:30]:
                    try:
                        link = row.find('a', href=True)
                        if not link:
                            continue

                        title = self.extract_text(link)
                        href = link.get('href', '')
                        full_url = urljoin(url, href)

                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} news from PRD Kerala")
            return articles

        except Exception as e:
            print(f"  Error scraping PRD Kerala: {e}")
            return []

    def _scrape_mp_info(self, url):
        """Scrape MP Info (Madhya Pradesh Govt portal) news."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Government portal - look for news/policy items
            news_items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['news', 'item', 'row', 'policy']))

            for item in news_items[:30]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Look for date
                    date_el = item.find(['span', 'td'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = item.get_text() if not date_el else date_el.get_text()
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Try table structure as fallback
            if not articles:
                links = soup.find_all('a', href=True)
                for link in links[:30]:
                    try:
                        href = link.get('href', '')
                        # Skip navigation links
                        if not href or '#' in href or 'javascript' in href.lower():
                            continue

                        title = self.extract_text(link)
                        full_url = urljoin(url, href)

                        if title and len(title) > 15:
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} items from MP Info")
            return articles

        except Exception as e:
            print(f"  Error scraping MP Info: {e}")
            return []

    def _scrape_invest_mp(self, url):
        """Scrape Invest MP news and events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for news/event cards
            items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['news', 'event', 'card', 'item', 'post']))

            for item in items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Get date
                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    # Get excerpt
                    excerpt_el = item.find(['p', 'div'], class_=lambda x: x and ('excerpt' in str(x).lower() or 'desc' in str(x).lower()))
                    content = self.extract_text(excerpt_el) if excerpt_el else title

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': content,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} items from Invest MP")
            return articles

        except Exception as e:
            print(f"  Error scraping Invest MP: {e}")
            return []

    # ==================== NORTHEAST STATE SCRAPERS ====================

    def _scrape_arunachal_ditc(self, url):
        """Scrape Arunachal Pradesh DITC policy page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Government policy pages often use tables or lists
            # Look for PDF links or policy items
            policy_links = soup.find_all('a', href=lambda x: x and ('.pdf' in x.lower() or 'policy' in x.lower()))

            for link in policy_links[:20]:
                try:
                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 5:
                        # Try to get title from filename
                        title = href.split('/')[-1].replace('.pdf', '').replace('-', ' ').replace('_', ' ').title()

                    if title and len(title) > 5:
                        articles.append({
                            'title': title,
                            'url': full_url,
                            'content': title,
                            'date_published': datetime.now().date(),
                            'source_url': url
                        })
                except Exception:
                    continue

            # Also try table rows
            if not articles:
                table_rows = soup.find_all('tr')
                for row in table_rows[:30]:
                    try:
                        link = row.find('a', href=True)
                        if not link:
                            continue

                        title = self.extract_text(link)
                        href = link.get('href', '')
                        full_url = urljoin(url, href)

                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} items from Arunachal DITC")
            return articles

        except Exception as e:
            print(f"  Error scraping Arunachal DITC: {e}")
            return []

    def _scrape_nic_news(self, url):
        """Scrape NIC state news/update pages (common structure across states)."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # NIC sites typically use WordPress or similar CMS
            news_items = soup.find_all(['article', 'div', 'li'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['news', 'update', 'post', 'item', 'entry']))

            for item in news_items[:25]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Get date
                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Try list items as fallback
            if not articles:
                list_items = soup.find_all('li')
                for item in list_items[:30]:
                    try:
                        link = item.find('a', href=True)
                        if not link:
                            continue

                        title = self.extract_text(link)
                        href = link.get('href', '')
                        full_url = urljoin(url, href)

                        if title and len(title) > 15:
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} news from NIC page")
            return articles

        except Exception as e:
            print(f"  Error scraping NIC news: {e}")
            return []

    def _scrape_nic_events(self, url):
        """Scrape NIC state events pages."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for event items
            event_items = soup.find_all(['article', 'div', 'li'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['event', 'item', 'card', 'post']))

            for item in event_items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if not title or len(title) < 5:
                        continue

                    # Get date
                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from NIC page")
            return articles

        except Exception as e:
            print(f"  Error scraping NIC events: {e}")
            return []

    def _scrape_tripura_times(self, url):
        """Scrape Tripura Times news page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for news items/cards
            news_items = soup.find_all(['div', 'article'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['news', 'item', 'card', 'story', 'post']))

            for item in news_items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': datetime.now().date(),
                        'source_url': url
                    })
                except Exception:
                    continue

            # Try direct news links
            if not articles:
                news_links = soup.find_all('a', href=lambda x: x and ('news' in str(x).lower() or 'story' in str(x).lower()))
                seen_urls = set()
                for link in news_links[:20]:
                    try:
                        href = link.get('href', '')
                        if href in seen_urls:
                            continue
                        seen_urls.add(href)

                        title = self.extract_text(link)
                        full_url = urljoin(url, href)

                        if title and len(title) > 15:
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} news from Tripura Times")
            return articles

        except Exception as e:
            print(f"  Error scraping Tripura Times: {e}")
            return []

    def _scrape_tripura_chronicle(self, url):
        """Scrape Tripura Chronicle local news."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Extract category from URL for filtering
            category_path = url.rstrip('/').split('/')[-1]  # e.g., 'local-news'

            # Pattern: /category-name/article-slug/ (match article URLs, not category pages)
            # Don't use $ anchor so we can catch URLs with #fragments
            article_pattern = re.compile(rf'/{category_path}/[a-z0-9-]+/')

            # Find all links that match article URL pattern
            seen_urls = set()
            all_links = soup.find_all('a', href=True)

            for link in all_links:
                try:
                    href = link.get('href', '')

                    # Skip category pages
                    if '/category/' in href:
                        continue

                    # Skip if not matching article pattern
                    if not href or not article_pattern.search(href):
                        continue

                    # Get title first
                    title = link.get_text(strip=True)

                    # Skip empty titles
                    if not title or len(title) < 15:
                        continue

                    # Normalize URL (remove #fragments) for deduplication
                    clean_href = href.split('#')[0]
                    if clean_href in seen_urls:
                        continue
                    seen_urls.add(clean_href)

                    full_url = urljoin(url, clean_href)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': datetime.now().date(),
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} news from Tripura Chronicle")
            return articles

        except Exception as e:
            print(f"  Error scraping Tripura Chronicle: {e}")
            return []

    def _scrape_startup_assam(self, url):
        """Scrape Startup Assam portal."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for content items, news, updates
            items = soup.find_all(['div', 'article', 'li'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['news', 'update', 'post', 'item', 'card']))

            for item in items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': datetime.now().date(),
                        'source_url': url
                    })
                except Exception:
                    continue

            # Try table structure (common in govt sites)
            if not articles:
                table_rows = soup.find_all('tr')
                for row in table_rows[:25]:
                    try:
                        link = row.find('a', href=True)
                        if not link:
                            continue

                        title = self.extract_text(link)
                        href = link.get('href', '')
                        full_url = urljoin(url, href)

                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} items from Startup Assam")
            return articles

        except Exception as e:
            print(f"  Error scraping Startup Assam: {e}")
            return []

    def _scrape_startup_manipur(self, url):
        """Scrape Startup Manipur notifications."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # WordPress category page structure
            post_items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['post', 'article', 'entry', 'notification', 'item']))

            for item in post_items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4'])
                    if not title_el:
                        title_el = item.find('a')

                    if not title_el:
                        continue

                    link = title_el.find('a', href=True) if title_el.name != 'a' else title_el
                    if not link:
                        link = item.find('a', href=True)

                    if not link:
                        continue

                    title = self.extract_text(title_el)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Get date
                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} notifications from Startup Manipur")
            return articles

        except Exception as e:
            print(f"  Error scraping Startup Manipur: {e}")
            return []

    def _scrape_meghalaya_gov(self, url):
        """Scrape Meghalaya Gov pages (press releases, notifications, press)."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Government portal - look for content items
            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['press', 'release', 'notification', 'item', 'row', 'news']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Look for date
                    date_el = item.find(['span', 'td', 'time'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = item.get_text() if not date_el else date_el.get_text()
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Try table rows as fallback
            if not articles:
                table_rows = soup.find_all('tr')
                for row in table_rows[:30]:
                    try:
                        link = row.find('a', href=True)
                        if not link:
                            continue

                        title = self.extract_text(link)
                        href = link.get('href', '')
                        full_url = urljoin(url, href)

                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} items from Meghalaya Gov")
            return articles

        except Exception as e:
            print(f"  Error scraping Meghalaya Gov: {e}")
            return []

    def _scrape_prime_meghalaya(self, url):
        """Scrape Prime Meghalaya news updates."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # WordPress structure
            post_items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['post', 'article', 'entry', 'news', 'update']))

            for item in post_items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4'])
                    if not title_el:
                        continue

                    link = title_el.find('a', href=True) or item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(title_el)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Get date
                    date_el = item.find(['time', 'span'], class_=lambda x: x and ('date' in str(x).lower() or 'posted' in str(x).lower()))
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} news from Prime Meghalaya")
            return articles

        except Exception as e:
            print(f"  Error scraping Prime Meghalaya: {e}")
            return []

    def _scrape_invest_meghalaya(self, url):
        """Scrape Invest Meghalaya notifications."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # ASPX page with table or grid structure
            table_rows = soup.find_all('tr')

            for row in table_rows[:30]:
                try:
                    link = row.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Look for date in cells
                    cells = row.find_all('td')
                    date_published = datetime.now().date()
                    for cell in cells:
                        cell_text = cell.get_text(strip=True)
                        if re.search(r'\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}', cell_text):
                            date_published = self._parse_date_text(cell_text)
                            break

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Also try div/grid items
            if not articles:
                items = soup.find_all(['div', 'li'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['notification', 'item', 'card']))
                for item in items[:20]:
                    try:
                        link = item.find('a', href=True)
                        if not link:
                            continue

                        title = self.extract_text(link)
                        href = link.get('href', '')
                        full_url = urljoin(url, href)

                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} notifications from Invest Meghalaya")
            return articles

        except Exception as e:
            print(f"  Error scraping Invest Meghalaya: {e}")
            return []

    def _scrape_dict_mizoram(self, url):
        """Scrape DICT Mizoram notifications/news pages."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # WordPress category page structure
            post_items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['post', 'article', 'entry', 'item', 'notification', 'news']))

            for item in post_items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4'])
                    if not title_el:
                        title_el = item.find('a')

                    if not title_el:
                        continue

                    link = title_el.find('a', href=True) if title_el.name != 'a' else title_el
                    if not link:
                        link = item.find('a', href=True)

                    if not link:
                        continue

                    title = self.extract_text(title_el)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Get date
                    date_el = item.find(['time', 'span'], class_=lambda x: x and ('date' in str(x).lower() or 'posted' in str(x).lower()))
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} items from DICT Mizoram")
            return articles

        except Exception as e:
            print(f"  Error scraping DICT Mizoram: {e}")
            return []

    def _scrape_startup_mizoram(self, url):
        """Scrape Startup Mizoram events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for event items
            event_items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['event', 'card', 'item', 'post']))

            for item in event_items[:20]:
                try:
                    title_el = item.find(['h2', 'h3', 'h4', 'a'])
                    title = self.extract_text(title_el) if title_el else ''

                    link = item.find('a', href=True)
                    href = link.get('href', '') if link else ''
                    full_url = urljoin(url, href)

                    if not title or len(title) < 5:
                        continue

                    # Get date
                    date_el = item.find(['time', 'span', 'div'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from Startup Mizoram")
            return articles

        except Exception as e:
            print(f"  Error scraping Startup Mizoram: {e}")
            return []

    def _scrape_startup_nagaland(self, url):
        """Scrape Startup Nagaland notifications page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # May use JavaScript, try to get whatever static content exists
            # Look for notification items or table rows
            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['notification', 'item', 'card', 'row', 'post']))

            for item in items[:20]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': datetime.now().date(),
                        'source_url': url
                    })
                except Exception:
                    continue

            # Try direct links as fallback
            if not articles:
                all_links = soup.find_all('a', href=True)
                seen_urls = set()
                for link in all_links[:30]:
                    try:
                        href = link.get('href', '')
                        if not href or '#' in href or 'javascript' in href.lower():
                            continue
                        if href in seen_urls:
                            continue
                        seen_urls.add(href)

                        title = self.extract_text(link)
                        full_url = urljoin(url, href)

                        # Skip navigation links
                        if title and len(title) > 15 and 'notification' in href.lower() or 'news' in href.lower():
                            articles.append({
                                'title': title,
                                'url': full_url,
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })
                    except Exception:
                        continue

            print(f"  Scraped {len(articles)} notifications from Startup Nagaland")
            return articles

        except Exception as e:
            print(f"  Error scraping Startup Nagaland: {e}")
            return []

    def _scrape_ladakh_gov(self, url):
        """Scrape Ladakh government news page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for news items - common patterns on gov sites
            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['news', 'item', 'row', 'card', 'post']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Get date if available
                    date_el = item.find(['span', 'div', 'time'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} items from Ladakh Gov")
            return articles

        except Exception as e:
            print(f"  Error scraping Ladakh Gov: {e}")
            return []

    def _scrape_voice_of_ladakh(self, url):
        """Scrape Voice of Ladakh tech/news section."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for article cards
            items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['post', 'article', 'card', 'item']))

            for item in items[:20]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    # Try to get title from h2/h3 or link text
                    title_el = item.find(['h2', 'h3', 'h4'])
                    title = self.extract_text(title_el) if title_el else self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 15:
                        continue

                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from Voice of Ladakh")
            return articles

        except Exception as e:
            print(f"  Error scraping Voice of Ladakh: {e}")
            return []

    def _scrape_uol_events(self, url):
        """Scrape University of Ladakh events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for event items
            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['event', 'item', 'row', 'card']))

            for item in items[:20]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': datetime.now().date(),
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from UoL")
            return articles

        except Exception as e:
            print(f"  Error scraping UoL events: {e}")
            return []

    def _scrape_greater_kashmir(self, url):
        """Scrape Greater Kashmir news site."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for article cards
            items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['post', 'article', 'card', 'story', 'item']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title_el = item.find(['h2', 'h3', 'h4'])
                    title = self.extract_text(title_el) if title_el else self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 15:
                        continue

                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from Greater Kashmir")
            return articles

        except Exception as e:
            print(f"  Error scraping Greater Kashmir: {e}")
            return []

    def _scrape_jharkhand_gov_events(self, url):
        """Scrape Jharkhand government events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['event', 'item', 'row', 'card', 'news']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': datetime.now().date(),
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} items from Jharkhand Gov Events")
            return articles

        except Exception as e:
            print(f"  Error scraping Jharkhand Gov Events: {e}")
            return []

    def _scrape_knowafest(self, url):
        """Scrape KnowAFest events listing - works for both all-India and state-specific pages."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for event cards - KnowAFest uses specific structure
            items = soup.find_all(['div', 'article'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['event', 'fest', 'card', 'item', 'workshop']))

            for item in items[:30]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title_el = item.find(['h2', 'h3', 'h4', 'h5'])
                    title = self.extract_text(title_el) if title_el else self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Extract location if available
                    location_el = item.find(['span', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['location', 'venue', 'city']))
                    location = location_el.get_text(strip=True) if location_el else ''

                    # Extract date if available
                    date_el = item.find(['span', 'div'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    # Combine title with location for better geo attribution
                    full_title = f"{title} - {location}" if location else title

                    articles.append({
                        'title': full_title,
                        'url': full_url,
                        'content': full_title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Fallback: look for direct event links
            if not articles:
                all_links = soup.find_all('a', href=True)
                seen = set()
                for link in all_links[:40]:
                    href = link.get('href', '')
                    if '/college/' in href or '/fest/' in href or '/workshop/' in href:
                        if href in seen:
                            continue
                        seen.add(href)
                        title = self.extract_text(link)
                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': urljoin(url, href),
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })

            print(f"  Scraped {len(articles)} events from KnowAFest")
            return articles

        except Exception as e:
            print(f"  Error scraping KnowAFest: {e}")
            return []

    def _scrape_allconferencealert(self, url):
        """Scrape AllConferenceAlert events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for conference/event listings
            items = soup.find_all(['div', 'tr', 'article'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['conference', 'event', 'item', 'row', 'card']))

            for item in items[:30]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    # Get location/city
                    location_el = item.find(['span', 'td', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['city', 'location', 'venue']))
                    location = location_el.get_text(strip=True) if location_el else ''

                    # Get date
                    date_el = item.find(['span', 'td', 'div'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    full_title = f"{title} - {location}" if location else title

                    articles.append({
                        'title': full_title,
                        'url': full_url,
                        'content': full_title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} conferences from AllConferenceAlert")
            return articles

        except Exception as e:
            print(f"  Error scraping AllConferenceAlert: {e}")
            return []

    def _scrape_startup_uttarakhand(self, url):
        """Scrape Startup Uttarakhand pages (notifications, policy, guidelines)."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for notification/policy items
            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['notification', 'policy', 'item', 'row', 'card', 'post']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    date_el = item.find(['span', 'div'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Fallback for PDF/document links
            if not articles:
                all_links = soup.find_all('a', href=True)
                seen = set()
                for link in all_links[:30]:
                    href = link.get('href', '')
                    if href in seen or not href:
                        continue
                    seen.add(href)

                    if '.pdf' in href.lower() or 'notification' in href.lower() or 'policy' in href.lower():
                        title = self.extract_text(link)
                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': urljoin(url, href),
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })

            print(f"  Scraped {len(articles)} items from Startup Uttarakhand")
            return articles

        except Exception as e:
            print(f"  Error scraping Startup Uttarakhand: {e}")
            return []

    def _scrape_webel_events(self, url):
        """Scrape Webel (West Bengal Electronics) events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['event', 'item', 'row', 'card', 'news']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    date_el = item.find(['span', 'div'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from Webel")
            return articles

        except Exception as e:
            print(f"  Error scraping Webel events: {e}")
            return []

    def _scrape_bengal_chamber(self, url):
        """Scrape Bengal Chamber of Commerce events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['event', 'item', 'row', 'card', 'programme']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    date_el = item.find(['span', 'div'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from Bengal Chamber")
            return articles

        except Exception as e:
            print(f"  Error scraping Bengal Chamber: {e}")
            return []

    def _scrape_odisha_gov(self, url):
        """Scrape Odisha government news page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['news', 'item', 'row', 'card', 'press']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    date_el = item.find(['span', 'div'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} items from Odisha Gov")
            return articles

        except Exception as e:
            print(f"  Error scraping Odisha Gov: {e}")
            return []

    def _scrape_odisha_it(self, url):
        """Scrape Odisha IT workshops/events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['workshop', 'event', 'item', 'row', 'card']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    date_el = item.find(['span', 'div'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} items from Odisha IT")
            return articles

        except Exception as e:
            print(f"  Error scraping Odisha IT: {e}")
            return []

    def _scrape_bihar_egazette(self, url):
        """Scrape Bihar e-Gazette notifications."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for notification/gazette items - usually table or list
            items = soup.find_all(['tr', 'li', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['notification', 'item', 'row', 'gazette']))

            for item in items[:30]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    date_el = item.find(['td', 'span', 'div'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Fallback for PDF links
            if not articles:
                all_links = soup.find_all('a', href=True)
                seen = set()
                for link in all_links[:30]:
                    href = link.get('href', '')
                    if href in seen or not href:
                        continue
                    seen.add(href)

                    if '.pdf' in href.lower() or 'notification' in href.lower():
                        title = self.extract_text(link)
                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': urljoin(url, href),
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })

            print(f"  Scraped {len(articles)} notifications from Bihar e-Gazette")
            return articles

        except Exception as e:
            print(f"  Error scraping Bihar e-Gazette: {e}")
            return []

    def _scrape_bihar_tech(self, url):
        """Scrape Bihar Tech Association news/events."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            items = soup.find_all(['div', 'article', 'li'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['news', 'event', 'item', 'card', 'post']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title_el = item.find(['h2', 'h3', 'h4'])
                    title = self.extract_text(title_el) if title_el else self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    date_el = item.find(['span', 'div', 'time'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} items from Bihar Tech Association")
            return articles

        except Exception as e:
            print(f"  Error scraping Bihar Tech Association: {e}")
            return []

    def _scrape_chips_cg(self, url):
        """Scrape CHiPS Chhattisgarh events page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['event', 'item', 'row', 'card', 'news']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    date_el = item.find(['span', 'div'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} events from CHiPS CG")
            return articles

        except Exception as e:
            print(f"  Error scraping CHiPS CG: {e}")
            return []

    def _scrape_techcircle(self, url):
        """Scrape TechCircle policy news page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # TechCircle has article cards
            items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['article', 'post', 'card', 'story', 'item']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title_el = item.find(['h2', 'h3', 'h4'])
                    title = self.extract_text(title_el) if title_el else self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 15:
                        continue

                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from TechCircle")
            return articles

        except Exception as e:
            print(f"  Error scraping TechCircle: {e}")
            return []

    def _scrape_cellit(self, url):
        """Scrape CellIt magazine news."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for article/news items
            items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['article', 'post', 'card', 'news', 'item']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title_el = item.find(['h2', 'h3', 'h4'])
                    title = self.extract_text(title_el) if title_el else self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 15:
                        continue

                    # Skip homepage/category links
                    if href == '/' or href == url or '/category/' in href:
                        continue

                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from CellIt")
            return articles

        except Exception as e:
            print(f"  Error scraping CellIt: {e}")
            return []

    def _scrape_nenews(self, url):
        """Scrape NE News tech section."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['article', 'post', 'card', 'story', 'item']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title_el = item.find(['h2', 'h3', 'h4'])
                    title = self.extract_text(title_el) if title_el else self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 15:
                        continue

                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from NE News")
            return articles

        except Exception as e:
            print(f"  Error scraping NE News: {e}")
            return []

    def _scrape_indiatodayne(self, url):
        """Scrape India Today Northeast news."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['article', 'story', 'card', 'news', 'item']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title_el = item.find(['h2', 'h3', 'h4'])
                    title = self.extract_text(title_el) if title_el else self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 15:
                        continue

                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from India Today NE")
            return articles

        except Exception as e:
            print(f"  Error scraping India Today NE: {e}")
            return []

    def _scrape_tamilnadu_tech(self, url):
        """Scrape TamilNadu.tech news portal."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            items = soup.find_all(['article', 'div'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['article', 'post', 'card', 'news', 'item']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title_el = item.find(['h2', 'h3', 'h4'])
                    title = self.extract_text(title_el) if title_el else self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 15:
                        continue

                    # Skip category/tag links
                    if '/category/' in href or '/tag/' in href:
                        continue

                    date_el = item.find(['time', 'span'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            print(f"  Scraped {len(articles)} articles from TamilNadu.tech")
            return articles

        except Exception as e:
            print(f"  Error scraping TamilNadu.tech: {e}")
            return []

    def _scrape_startup_goa(self, url):
        """Scrape Startup Goa press releases page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for press release items
            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['press', 'release', 'news', 'item', 'card', 'post']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title_el = item.find(['h2', 'h3', 'h4', 'h5'])
                    title = self.extract_text(title_el) if title_el else self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    date_el = item.find(['span', 'div', 'time'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Fallback: look for any links with press/release in URL
            if not articles:
                all_links = soup.find_all('a', href=True)
                seen = set()
                for link in all_links[:30]:
                    href = link.get('href', '')
                    if href in seen or not href:
                        continue
                    seen.add(href)

                    if 'press' in href.lower() or 'release' in href.lower() or 'news' in href.lower():
                        title = self.extract_text(link)
                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': urljoin(url, href),
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })

            print(f"  Scraped {len(articles)} press releases from Startup Goa")
            return articles

        except Exception as e:
            print(f"  Error scraping Startup Goa: {e}")
            return []

    def _scrape_goa_dit(self, url):
        """Scrape Goa DIT schemes and policies page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for policy/scheme items
            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['scheme', 'policy', 'item', 'card', 'row']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': datetime.now().date(),
                        'source_url': url
                    })
                except Exception:
                    continue

            # Fallback for PDF links
            if not articles:
                all_links = soup.find_all('a', href=True)
                seen = set()
                for link in all_links[:30]:
                    href = link.get('href', '')
                    if href in seen or not href:
                        continue
                    seen.add(href)

                    if '.pdf' in href.lower() or 'policy' in href.lower() or 'scheme' in href.lower():
                        title = self.extract_text(link)
                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': urljoin(url, href),
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })

            print(f"  Scraped {len(articles)} schemes/policies from Goa DIT")
            return articles

        except Exception as e:
            print(f"  Error scraping Goa DIT: {e}")
            return []

    def _scrape_haryana_it(self, url):
        """Scrape Haryana IT notifications page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for notification items
            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['notification', 'item', 'card', 'row', 'post']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title = self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    date_el = item.find(['span', 'div', 'time'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Fallback for PDF/notification links
            if not articles:
                all_links = soup.find_all('a', href=True)
                seen = set()
                for link in all_links[:30]:
                    href = link.get('href', '')
                    if href in seen or not href:
                        continue
                    seen.add(href)

                    if '.pdf' in href.lower() or 'notification' in href.lower():
                        title = self.extract_text(link)
                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': urljoin(url, href),
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })

            print(f"  Scraped {len(articles)} notifications from Haryana IT")
            return articles

        except Exception as e:
            print(f"  Error scraping Haryana IT: {e}")
            return []

    def _scrape_startup_haryana(self, url):
        """Scrape Startup Haryana policies page."""
        try:
            response = self.fetch_url(url)
            if not response:
                return []

            soup = self.parse_html(response.content)
            articles = []

            # Look for policy items
            items = soup.find_all(['div', 'article', 'li', 'tr'], class_=lambda x: x and any(kw in str(x).lower() for kw in ['policy', 'item', 'card', 'row', 'post']))

            for item in items[:25]:
                try:
                    link = item.find('a', href=True)
                    if not link:
                        continue

                    title_el = item.find(['h2', 'h3', 'h4', 'h5'])
                    title = self.extract_text(title_el) if title_el else self.extract_text(link)
                    href = link.get('href', '')
                    full_url = urljoin(url, href)

                    if not title or len(title) < 10:
                        continue

                    date_el = item.find(['span', 'div', 'time'], class_=lambda x: x and 'date' in str(x).lower())
                    date_text = date_el.get_text(strip=True) if date_el else ''
                    date_published = self._parse_date_text(date_text)

                    articles.append({
                        'title': title,
                        'url': full_url,
                        'content': title,
                        'date_published': date_published,
                        'source_url': url
                    })
                except Exception:
                    continue

            # Fallback for PDF/policy links
            if not articles:
                all_links = soup.find_all('a', href=True)
                seen = set()
                for link in all_links[:30]:
                    href = link.get('href', '')
                    if href in seen or not href:
                        continue
                    seen.add(href)

                    if '.pdf' in href.lower() or 'policy' in href.lower():
                        title = self.extract_text(link)
                        if title and len(title) > 10:
                            articles.append({
                                'title': title,
                                'url': urljoin(url, href),
                                'content': title,
                                'date_published': datetime.now().date(),
                                'source_url': url
                            })

            print(f"  Scraped {len(articles)} policies from Startup Haryana")
            return articles

        except Exception as e:
            print(f"  Error scraping Startup Haryana: {e}")
            return []
