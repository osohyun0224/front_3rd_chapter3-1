import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event } from '../../types.ts';

const mockToast = vi.fn();
vi.mock('@chakra-ui/react', () => ({
  useToast: () => mockToast,
}));

describe('useEventOperations', () => {
  beforeEach(() => {
    mockToast.mockClear();
  });

  it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {
    const initialEvent: Event = {
      id: '1',
      title: 'Harry와 1-on-1',
      date: '2024-11-05',
      startTime: '15:00',
      endTime: '16:00',
      description: '2024 하반기 팀 리더 1-on-1',
      location: '누누커피',
      category: '개인',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    setupMockHandlerCreation([initialEvent]);

    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.events).toEqual([initialEvent]);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정 로딩 완료!',
        status: 'info',
      })
    );
  });

  it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
    const initialEvent: Event = {
      id: '1',
      title: 'Harry와 1-on-1',
      date: '2024-11-05',
      startTime: '15:00',
      endTime: '16:00',
      description: '2024 하반기 팀 리더 1-on-1',
      location: '누누커피',
      category: '개인',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    const newEvent: Event = {
      id: '2',
      title: '새 회의',
      date: '2024-10-16',
      startTime: '14:00',
      endTime: '15:00',
      description: '새로운 미팅',
      location: '회의실 A',
      category: '회의',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 15,
    };

    setupMockHandlerCreation([initialEvent]);

    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await result.current.saveEvent(newEvent);
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정이 추가되었습니다.',
        status: 'success',
      })
    );
    expect(result.current.events).toEqual([initialEvent, newEvent]);
  });

  it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
    const initialEvent: Event = {
      id: '1',
      title: 'Harry와 1-on-1',
      date: '2024-11-05',
      startTime: '15:00',
      endTime: '16:00',
      description: '2024 하반기 팀 리더 1-on-1',
      location: '누누커피',
      category: '개인',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    const updatedEvent: Event = {
      id: '1',
      title: '수정된 회의',
      date: '2024-11-03',
      startTime: '11:00',
      endTime: '11:00',
      description: '수정된 미팅',
      location: '회의실 B',
      category: '회의',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 15,
    };

    setupMockHandlerUpdating([initialEvent]);

    const { result } = renderHook(() => useEventOperations(true));

    await act(async () => {
      await result.current.saveEvent(updatedEvent);
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정이 수정되었습니다.',
        status: 'success',
      })
    );
    expect(result.current.events).toEqual([updatedEvent]);
  });

  it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
    const initialEvent: Event = {
      id: '1',
      title: 'Harry와 1-on-1',
      date: '2024-11-05',
      startTime: '15:00',
      endTime: '16:00',
      description: '2024 하반기 팀 리더 1-on-1',
      location: '누누커피',
      category: '개인',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    };

    setupMockHandlerDeletion([initialEvent]);

    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await result.current.deleteEvent('1');
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정이 삭제되었습니다.',
        status: 'info',
      })
    );
    expect(result.current.events).toEqual([]);
  });

  it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
    server.use(
      http.get('/api/events', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    renderHook(() => useEventOperations(false));

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '이벤트 로딩 실패',
        status: 'error',
      })
    );
  });

  it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {
    server.use(
      http.put('/api/events/:id', () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    const { result } = renderHook(() => useEventOperations(true));

    await act(async () => {
      await result.current.saveEvent({
        id: '999',
        title: '존재하지 않는 이벤트',
      } as Event);
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정 저장 실패',
        status: 'error',
      })
    );
  });

  it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
    server.use(
      http.delete('/api/events/:id', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useEventOperations(false));

    await act(async () => {
      await result.current.deleteEvent('1');
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '일정 삭제 실패',
        status: 'error',
      })
    );
  });
});
