package com.github.finncull.urlshortener;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
@Import(TestcontainersConfiguration.class)
class UrlShortenerApplicationTests {

	@Test
	void contextLoads() {
	}

}
